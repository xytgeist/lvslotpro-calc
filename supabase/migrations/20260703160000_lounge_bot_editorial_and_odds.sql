-- X editorial queue, X sources, sports odds config, editorial + create-bot RPCs.

-- ---------------------------------------------------------------------------
-- profiles.is_bot (staff visibility)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists is_bot boolean not null default false;

comment on column public.profiles.is_bot is 'True for automated Lounge bot personas.';

-- ---------------------------------------------------------------------------
-- X sources (per niche bot)
-- ---------------------------------------------------------------------------

create table if not exists public.lounge_bot_x_sources (
  id uuid primary key default gen_random_uuid(),
  bot_user_id uuid not null references public.lounge_bot_accounts (user_id) on delete cascade,
  x_handle text not null,
  x_user_id text,
  enabled boolean not null default true,
  since_id text,
  exclude_replies boolean not null default true,
  exclude_retweets boolean not null default true,
  filters jsonb not null default '{}'::jsonb,
  last_polled_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  constraint lounge_bot_x_sources_handle_format check (x_handle ~ '^[A-Za-z0-9_]{1,15}$')
);

create unique index if not exists lounge_bot_x_sources_bot_handle_idx
  on public.lounge_bot_x_sources (bot_user_id, lower(x_handle));

create index if not exists lounge_bot_x_sources_bot_idx on public.lounge_bot_x_sources (bot_user_id);

-- ---------------------------------------------------------------------------
-- Editorial queue (X + manual test drafts)
-- ---------------------------------------------------------------------------

create table if not exists public.lounge_bot_queue (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('x', 'manual', 'odds_api', 'market_news')),
  source_id uuid references public.lounge_bot_x_sources (id) on delete set null,
  external_key text,
  source_payload jsonb,
  bot_user_id uuid not null references public.lounge_bot_accounts (user_id) on delete cascade,
  source_text text,
  source_url text,
  source_posted_at timestamptz,
  draft_caption text not null default '',
  category_pills text[] not null default '{}'::text[],
  attach_source_link boolean not null default false,
  status text not null default 'pending_review' check (
    status in ('pending_review', 'scheduled', 'published', 'skipped', 'failed', 'drafting', 'ingesting')
  ),
  scheduled_at timestamptz,
  published_post_id uuid references public.community_feed_posts (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  skip_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lounge_bot_queue_status_bot_idx
  on public.lounge_bot_queue (status, bot_user_id, created_at desc);

create unique index if not exists lounge_bot_queue_external_dedupe_idx
  on public.lounge_bot_queue (bot_user_id, source_type, external_key)
  where external_key is not null;

-- ---------------------------------------------------------------------------
-- Sports odds config + snapshot cache
-- ---------------------------------------------------------------------------

create table if not exists public.lounge_bot_odds_config (
  bot_user_id uuid primary key references public.lounge_bot_accounts (user_id) on delete cascade,
  sports_keys text[] not null default array['americanfootball_nfl', 'basketball_nba', 'baseball_mlb']::text[],
  regions text[] not null default array['us']::text[],
  markets text[] not null default array['h2h', 'spreads']::text[],
  min_edge_pct numeric not null default 4,
  max_picks_per_run integer not null default 1 check (max_picks_per_run between 1 and 4),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.lounge_odds_snapshots (
  id uuid primary key default gen_random_uuid(),
  bot_user_id uuid not null references public.lounge_bot_accounts (user_id) on delete cascade,
  sport text not null,
  fetched_at timestamptz not null default now(),
  payload jsonb not null
);

create index if not exists lounge_odds_snapshots_bot_sport_idx
  on public.lounge_odds_snapshots (bot_user_id, sport, fetched_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.lounge_bot_x_sources enable row level security;
alter table public.lounge_bot_queue enable row level security;
alter table public.lounge_bot_odds_config enable row level security;
alter table public.lounge_odds_snapshots enable row level security;

drop policy if exists lounge_bot_x_sources_admin_all on public.lounge_bot_x_sources;
create policy lounge_bot_x_sources_admin_all on public.lounge_bot_x_sources
  for all to authenticated
  using (public.play_log_viewer_is_admin())
  with check (public.play_log_viewer_is_admin());

drop policy if exists lounge_bot_queue_admin_all on public.lounge_bot_queue;
create policy lounge_bot_queue_admin_all on public.lounge_bot_queue
  for all to authenticated
  using (public.play_log_viewer_is_admin())
  with check (public.play_log_viewer_is_admin());

drop policy if exists lounge_bot_odds_config_admin_all on public.lounge_bot_odds_config;
create policy lounge_bot_odds_config_admin_all on public.lounge_bot_odds_config
  for all to authenticated
  using (public.play_log_viewer_is_admin())
  with check (public.play_log_viewer_is_admin());

drop policy if exists lounge_odds_snapshots_admin_select on public.lounge_odds_snapshots;
create policy lounge_odds_snapshots_admin_select on public.lounge_odds_snapshots
  for select to authenticated
  using (public.play_log_viewer_is_admin());

-- ---------------------------------------------------------------------------
-- Editorial inbox list
-- ---------------------------------------------------------------------------

create or replace function public.admin_lounge_bot_editorial_inbox(
  p_status text default 'pending_review',
  p_bot_user_id uuid default null,
  p_limit integer default 50
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.play_log_viewer_is_admin() then raise exception 'admin only'; end if;

  return coalesce((
    select jsonb_agg(row order by row->>'created_at' desc)
    from (
      select jsonb_build_object(
        'id', q.id,
        'bot_user_id', q.bot_user_id,
        'bot_slug', a.slug,
        'bot_display_name', a.display_name,
        'source_type', q.source_type,
        'source_text', q.source_text,
        'source_url', q.source_url,
        'source_posted_at', q.source_posted_at,
        'draft_caption', q.draft_caption,
        'category_pills', coalesce(q.category_pills, '{}'::text[]),
        'status', q.status,
        'scheduled_at', q.scheduled_at,
        'published_post_id', q.published_post_id,
        'created_at', q.created_at,
        'x_handle', xs.x_handle
      ) as row
      from public.lounge_bot_queue q
      join public.lounge_bot_accounts a on a.user_id = q.bot_user_id
      left join public.lounge_bot_x_sources xs on xs.id = q.source_id
      where q.status = coalesce(nullif(p_status, ''), 'pending_review')
        and (p_bot_user_id is null or q.bot_user_id = p_bot_user_id)
      order by q.created_at desc
      limit greatest(1, least(coalesce(p_limit, 50), 100))
    ) sub
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_lounge_bot_editorial_inbox(text, uuid, integer) from public;
grant execute on function public.admin_lounge_bot_editorial_inbox(text, uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Queue update (draft, schedule, skip)
-- ---------------------------------------------------------------------------

create or replace function public.admin_lounge_bot_queue_update(
  p_queue_id uuid,
  p_patch jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.lounge_bot_queue%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.play_log_viewer_is_admin() then raise exception 'admin only'; end if;
  if p_queue_id is null then raise exception 'p_queue_id required'; end if;

  select * into v_row from public.lounge_bot_queue where id = p_queue_id;
  if not found then raise exception 'queue row not found'; end if;

  update public.lounge_bot_queue
  set
    draft_caption = case
      when p_patch ? 'draft_caption' then left(trim(p_patch->>'draft_caption'), 500)
      else draft_caption
    end,
    category_pills = case
      when p_patch ? 'category_pills' and jsonb_typeof(p_patch->'category_pills') = 'array'
        then coalesce(
          (select array_agg(value)::text[] from jsonb_array_elements_text(p_patch->'category_pills')),
          category_pills
        )
      else category_pills
    end,
    status = coalesce(nullif(p_patch->>'status', ''), status),
    scheduled_at = case
      when p_patch ? 'scheduled_at' then (p_patch->>'scheduled_at')::timestamptz
      else scheduled_at
    end,
    skip_reason = coalesce(nullif(p_patch->>'skip_reason', ''), skip_reason),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  where id = p_queue_id
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'id', v_row.id,
    'status', v_row.status,
    'scheduled_at', v_row.scheduled_at
  );
end;
$$;

revoke all on function public.admin_lounge_bot_queue_update(uuid, jsonb) from public;
grant execute on function public.admin_lounge_bot_queue_update(uuid, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- Add X source handle
-- ---------------------------------------------------------------------------

create or replace function public.admin_lounge_bot_add_x_source(
  p_bot_user_id uuid,
  p_handle text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_handle text := lower(regexp_replace(trim(coalesce(p_handle, '')), '^@', ''));
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.play_log_viewer_is_admin() then raise exception 'admin only'; end if;
  if p_bot_user_id is null then raise exception 'p_bot_user_id required'; end if;
  if v_handle !~ '^[a-z0-9_]{1,15}$' then raise exception 'invalid X handle'; end if;

  if not exists (
    select 1 from public.lounge_bot_accounts a
    where a.user_id = p_bot_user_id and a.pipeline = 'x'
  ) then
    raise exception 'bot must have pipeline = x';
  end if;

  insert into public.lounge_bot_x_sources (bot_user_id, x_handle)
  values (p_bot_user_id, v_handle)
  on conflict do nothing
  returning id into v_id;

  if v_id is null then
    select s.id into v_id
    from public.lounge_bot_x_sources s
    where s.bot_user_id = p_bot_user_id and lower(s.x_handle) = v_handle;
  end if;

  return jsonb_build_object('ok', true, 'id', v_id, 'x_handle', v_handle);
end;
$$;

revoke all on function public.admin_lounge_bot_add_x_source(uuid, text) from public;
grant execute on function public.admin_lounge_bot_add_x_source(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Manual editorial draft (test / paste tweet)
-- ---------------------------------------------------------------------------

create or replace function public.admin_lounge_bot_queue_manual_draft(
  p_bot_user_id uuid,
  p_source_text text,
  p_draft_caption text default null,
  p_source_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_cap text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.play_log_viewer_is_admin() then raise exception 'admin only'; end if;

  v_cap := left(trim(coalesce(p_draft_caption, p_source_text, '')), 500);
  if v_cap = '' then raise exception 'caption required'; end if;

  insert into public.lounge_bot_queue (
    source_type, bot_user_id, source_text, source_url, draft_caption, status
  ) values (
    'manual', p_bot_user_id, left(trim(coalesce(p_source_text, '')), 2000),
    nullif(trim(coalesce(p_source_url, '')), ''), v_cap, 'pending_review'
  )
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

revoke all on function public.admin_lounge_bot_queue_manual_draft(uuid, text, text, text) from public;
grant execute on function public.admin_lounge_bot_queue_manual_draft(uuid, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Extend portal snapshot: x_sources + editorial counts
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
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.play_log_viewer_is_admin() then raise exception 'admin only'; end if;

  return jsonb_build_object(
    'generated_at', v_now,
    'editorial_pending', (
      select count(*)::int from public.lounge_bot_queue q where q.status = 'pending_review'
    ),
    'editorial_scheduled', (
      select count(*)::int from public.lounge_bot_queue q where q.status = 'scheduled'
    ),
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
          'is_bot', coalesce(p.is_bot, false),
          'pending_review', (
            select count(*)::int from public.lounge_bot_queue q
            where q.bot_user_id = a.user_id and q.status = 'pending_review'
          ),
          'posts_today', (
            select count(*)::int from public.lounge_bot_publish_log l
            where l.bot_user_id = a.user_id and l.status = 'published' and l.created_at >= v_day_start
          ),
          'posts_last_hour', (
            select count(*)::int from public.lounge_bot_publish_log l
            where l.bot_user_id = a.user_id and l.status = 'published' and l.created_at >= v_hour_start
          ),
          'sources', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', s.id, 'name', s.name, 'kind', s.kind, 'enabled', s.enabled,
              'poll_interval_sec', s.poll_interval_sec, 'last_polled_at', s.last_polled_at,
              'last_error', s.last_error
            ) order by s.name)
            from public.lounge_news_sources s where s.bot_user_id = a.user_id
          ), '[]'::jsonb),
          'x_sources', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', xs.id, 'x_handle', xs.x_handle, 'enabled', xs.enabled,
              'last_polled_at', xs.last_polled_at, 'last_error', xs.last_error
            ) order by xs.x_handle)
            from public.lounge_bot_x_sources xs where xs.bot_user_id = a.user_id
          ), '[]'::jsonb),
          'recent_posts', coalesce((
            select jsonb_agg(jsonb_build_object(
              'post_id', c.id, 'caption', c.caption,
              'category_pills', coalesce(c.category_pills, '{}'::text[]),
              'created_at', c.created_at, 'edited_at', c.edited_at,
              'like_count', c.like_count, 'comment_count', c.comment_count
            ) order by c.created_at desc)
            from (
              select c.* from public.community_feed_posts c
              where c.user_id = a.user_id and c.hidden_at is null
              order by c.created_at desc limit 20
            ) c
          ), '[]'::jsonb),
          'recent_log', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', l.id, 'status', l.status, 'caption', left(l.caption, 240),
              'score', l.score, 'post_id', l.post_id, 'error_message', l.error_message,
              'created_at', l.created_at
            ) order by l.created_at desc)
            from (
              select l.* from public.lounge_bot_publish_log l
              where l.bot_user_id = a.user_id order by l.created_at desc limit 15
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
