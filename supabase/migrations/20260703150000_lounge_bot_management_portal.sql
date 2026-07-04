-- Lounge bot management portal: run_state + unified admin snapshot/save RPCs.

alter table public.lounge_bot_accounts
  add column if not exists run_state text;

update public.lounge_bot_accounts
set run_state = case when enabled then 'running' else 'stopped' end
where run_state is null;

alter table public.lounge_bot_accounts
  alter column run_state set default 'stopped';

alter table public.lounge_bot_accounts
  alter column run_state set not null;

alter table public.lounge_bot_accounts
  drop constraint if exists lounge_bot_accounts_run_state_check;

alter table public.lounge_bot_accounts
  add constraint lounge_bot_accounts_run_state_check
  check (run_state in ('running', 'paused', 'stopped'));

comment on column public.lounge_bot_accounts.run_state is
  'running = ingest + publish; paused = no automation (config kept); stopped = off.';

-- Keep enabled in sync for legacy readers (edge fn uses run_state after deploy).
create or replace function public.lounge_bot_accounts_sync_enabled()
returns trigger
language plpgsql
as $$
begin
  new.enabled := (new.run_state = 'running');
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_lounge_bot_accounts_sync_enabled on public.lounge_bot_accounts;
create trigger trg_lounge_bot_accounts_sync_enabled
  before insert or update of run_state on public.lounge_bot_accounts
  for each row
  execute function public.lounge_bot_accounts_sync_enabled();

-- Backfill enabled from run_state
update public.lounge_bot_accounts
set enabled = (run_state = 'running');

-- ---------------------------------------------------------------------------
-- Portal snapshot (all bots)
-- ---------------------------------------------------------------------------

create or replace function public.admin_lounge_bot_portal_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_day_start timestamptz := date_trunc('day', v_now at time zone 'America/Los_Angeles') at time zone 'America/Los_Angeles';
  v_hour_start timestamptz := v_now - interval '1 hour';
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not public.play_log_viewer_is_admin() then
    raise exception 'admin only';
  end if;

  return jsonb_build_object(
    'generated_at', v_now,
    'bots', coalesce((
      select jsonb_agg(bot_row order by bot_row->>'slug')
      from (
        select jsonb_build_object(
          'user_id', a.user_id,
          'slug', a.slug,
          'pipeline', a.pipeline,
          'review_mode', a.review_mode,
          'display_name', a.display_name,
          'run_state', a.run_state,
          'enabled', a.enabled,
          'max_posts_per_day', a.max_posts_per_day,
          'max_posts_per_hour', a.max_posts_per_hour,
          'publish_score_threshold', a.publish_score_threshold,
          'category_pills_default', coalesce(a.category_pills_default, '{}'::text[]),
          'config', coalesce(a.config, '{}'::jsonb),
          'last_poll_at', a.last_poll_at,
          'last_publish_at', a.last_publish_at,
          'created_at', a.created_at,
          'handle', p.handle,
          'avatar_url', p.avatar_url,
          'posts_today', (
            select count(*)::int
            from public.lounge_bot_publish_log l
            where l.bot_user_id = a.user_id
              and l.status = 'published'
              and l.created_at >= v_day_start
          ),
          'posts_last_hour', (
            select count(*)::int
            from public.lounge_bot_publish_log l
            where l.bot_user_id = a.user_id
              and l.status = 'published'
              and l.created_at >= v_hour_start
          ),
          'sources', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', s.id,
              'name', s.name,
              'kind', s.kind,
              'enabled', s.enabled,
              'poll_interval_sec', s.poll_interval_sec,
              'last_polled_at', s.last_polled_at,
              'last_error', s.last_error
            ) order by s.name)
            from public.lounge_news_sources s
            where s.bot_user_id = a.user_id
          ), '[]'::jsonb),
          'recent_posts', coalesce((
            select jsonb_agg(jsonb_build_object(
              'post_id', c.id,
              'caption', c.caption,
              'category_pills', coalesce(c.category_pills, '{}'::text[]),
              'created_at', c.created_at,
              'edited_at', c.edited_at,
              'like_count', c.like_count,
              'comment_count', c.comment_count
            ) order by c.created_at desc)
            from (
              select c.*
              from public.community_feed_posts c
              where c.user_id = a.user_id
                and c.hidden_at is null
              order by c.created_at desc
              limit 20
            ) c
          ), '[]'::jsonb),
          'recent_log', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', l.id,
              'status', l.status,
              'caption', left(l.caption, 240),
              'score', l.score,
              'post_id', l.post_id,
              'error_message', l.error_message,
              'created_at', l.created_at
            ) order by l.created_at desc)
            from (
              select l.*
              from public.lounge_bot_publish_log l
              where l.bot_user_id = a.user_id
              order by l.created_at desc
              limit 15
            ) l
          ), '[]'::jsonb)
        ) as bot_row
        from public.lounge_bot_accounts a
        left join public.profiles p on p.user_id = a.user_id
      ) sub
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_lounge_bot_portal_snapshot() from public;
grant execute on function public.admin_lounge_bot_portal_snapshot() to authenticated;

comment on function public.admin_lounge_bot_portal_snapshot() is
  'Bot management portal: all bots, caps, sources, recent posts + publish log.';

-- ---------------------------------------------------------------------------
-- Save bot settings (partial patch)
-- ---------------------------------------------------------------------------

create or replace function public.admin_lounge_bot_save_settings(
  p_user_id uuid,
  p_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.lounge_bot_accounts%rowtype;
  v_config jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not public.play_log_viewer_is_admin() then
    raise exception 'admin only';
  end if;

  if p_user_id is null then
    raise exception 'p_user_id required';
  end if;

  select * into v_row from public.lounge_bot_accounts where user_id = p_user_id;
  if not found then
    raise exception 'bot not found';
  end if;

  v_config := coalesce(v_row.config, '{}'::jsonb);
  if p_patch ? 'config' and jsonb_typeof(p_patch->'config') = 'object' then
    v_config := v_config || (p_patch->'config');
  end if;

  update public.lounge_bot_accounts
  set
    run_state = coalesce(nullif(p_patch->>'run_state', ''), run_state),
    display_name = coalesce(nullif(p_patch->>'display_name', ''), display_name),
    max_posts_per_day = coalesce((p_patch->>'max_posts_per_day')::int, max_posts_per_day),
    max_posts_per_hour = coalesce((p_patch->>'max_posts_per_hour')::int, max_posts_per_hour),
    publish_score_threshold = coalesce((p_patch->>'publish_score_threshold')::numeric, publish_score_threshold),
    category_pills_default = case
      when p_patch ? 'category_pills_default' and jsonb_typeof(p_patch->'category_pills_default') = 'array'
        then coalesce(
          (select array_agg(value)::text[] from jsonb_array_elements_text(p_patch->'category_pills_default')),
          category_pills_default
        )
      else category_pills_default
    end,
    config = v_config,
    updated_at = now()
  where user_id = p_user_id
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'user_id', v_row.user_id,
    'run_state', v_row.run_state,
    'max_posts_per_day', v_row.max_posts_per_day,
    'max_posts_per_hour', v_row.max_posts_per_hour,
    'publish_score_threshold', v_row.publish_score_threshold
  );
end;
$$;

revoke all on function public.admin_lounge_bot_save_settings(uuid, jsonb) from public;
grant execute on function public.admin_lounge_bot_save_settings(uuid, jsonb) to authenticated;

-- Replace legacy single-bot snapshot with portal pointer (keep fn for older clients).
create or replace function public.admin_lounge_bot_ops_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_portal jsonb;
  v_bot jsonb;
begin
  v_portal := public.admin_lounge_bot_portal_snapshot();
  select elem into v_bot
  from jsonb_array_elements(coalesce(v_portal->'bots', '[]'::jsonb)) elem
  where elem->>'slug' = 'financial-wire'
  limit 1;

  return jsonb_build_object(
    'generated_at', v_portal->'generated_at',
    'financial_wire', case
      when v_bot is null then jsonb_build_object('configured', false)
      else jsonb_build_object(
        'configured', true,
        'user_id', v_bot->'user_id',
        'enabled', v_bot->'enabled',
        'run_state', v_bot->'run_state',
        'display_name', v_bot->'display_name',
        'last_poll_at', v_bot->'last_poll_at',
        'last_publish_at', v_bot->'last_publish_at',
        'max_posts_per_day', v_bot->'max_posts_per_day',
        'max_posts_per_hour', v_bot->'max_posts_per_hour',
        'publish_score_threshold', v_bot->'publish_score_threshold',
        'posts_today', v_bot->'posts_today',
        'posts_last_hour', v_bot->'posts_last_hour',
        'sources_enabled', (
          select count(*)::int
          from jsonb_array_elements(coalesce(v_bot->'sources', '[]'::jsonb)) s
          where (s->>'enabled')::boolean = true
        ),
        'recent_publishes', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', l->>'id',
            'caption', l->>'caption',
            'score', l->>'score',
            'post_id', l->>'post_id',
            'created_at', l->>'created_at'
          ))
          from jsonb_array_elements(coalesce(v_bot->'recent_log', '[]'::jsonb)) l
          where l->>'status' = 'published'
        ), '[]'::jsonb),
        'recent_errors', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', l->>'id',
            'error_message', l->>'error_message',
            'created_at', l->>'created_at'
          ))
          from jsonb_array_elements(coalesce(v_bot->'recent_log', '[]'::jsonb)) l
          where l->>'status' = 'failed'
        ), '[]'::jsonb)
      )
    end
  );
end;
$$;
