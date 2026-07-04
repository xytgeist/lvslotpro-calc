-- Financial wire bot (self-contained market news aggregator).
-- Edge fn: lounge-news-poll. Admin ops: admin_lounge_bot_ops_snapshot().

-- ---------------------------------------------------------------------------
-- Bot registry
-- ---------------------------------------------------------------------------

create table if not exists public.lounge_bot_accounts (
  user_id uuid primary key references auth.users (id) on delete cascade,
  slug text not null unique,
  pipeline text not null check (pipeline in ('odds_api', 'market_news', 'x', 'manual')),
  review_mode text not null check (review_mode in ('automatic', 'editorial')),
  display_name text,
  enabled boolean not null default false,
  category_pills_default text[] not null default '{}'::text[],
  max_posts_per_day integer not null default 12 check (max_posts_per_day between 1 and 100),
  max_posts_per_hour integer not null default 4 check (max_posts_per_hour between 1 and 30),
  publish_score_threshold numeric not null default 55 check (publish_score_threshold between 0 and 100),
  config jsonb not null default '{}'::jsonb,
  last_poll_at timestamptz,
  last_publish_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lounge_bot_accounts_review_mode_pipeline check (
    (pipeline = 'x' and review_mode = 'editorial')
    or (pipeline in ('odds_api', 'market_news') and review_mode = 'automatic')
    or (pipeline = 'manual')
  )
);

comment on table public.lounge_bot_accounts is
  'Edge Lounge bot personas. financial-wire uses pipeline=market_news, review_mode=automatic.';

create index if not exists lounge_bot_accounts_slug_idx on public.lounge_bot_accounts (slug);
create index if not exists lounge_bot_accounts_enabled_idx on public.lounge_bot_accounts (enabled) where enabled = true;

-- ---------------------------------------------------------------------------
-- Allowlisted news sources (per bot)
-- ---------------------------------------------------------------------------

create table if not exists public.lounge_news_sources (
  id uuid primary key default gen_random_uuid(),
  bot_user_id uuid not null references public.lounge_bot_accounts (user_id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('finnhub_general', 'finnhub_category', 'finnhub_company', 'rss')),
  poll_url text,
  api_config jsonb not null default '{}'::jsonb,
  poll_interval_sec integer not null default 180 check (poll_interval_sec between 60 and 3600),
  enabled boolean not null default true,
  last_polled_at timestamptz,
  last_cursor text,
  last_error text,
  created_at timestamptz not null default now()
);

create index if not exists lounge_news_sources_bot_idx on public.lounge_news_sources (bot_user_id);
create index if not exists lounge_news_sources_due_idx
  on public.lounge_news_sources (enabled, last_polled_at);

-- ---------------------------------------------------------------------------
-- Raw ingest + dedupe
-- ---------------------------------------------------------------------------

create table if not exists public.lounge_news_raw_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.lounge_news_sources (id) on delete cascade,
  bot_user_id uuid not null references public.lounge_bot_accounts (user_id) on delete cascade,
  external_id text not null,
  content_hash text not null,
  published_at timestamptz,
  title text not null,
  summary text,
  url text,
  tickers text[] not null default '{}'::text[],
  score numeric,
  raw jsonb,
  created_at timestamptz not null default now(),
  constraint lounge_news_raw_items_source_external unique (source_id, external_id)
);

create index if not exists lounge_news_raw_items_hash_idx on public.lounge_news_raw_items (content_hash);
create index if not exists lounge_news_raw_items_bot_created_idx
  on public.lounge_news_raw_items (bot_user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Publish audit log
-- ---------------------------------------------------------------------------

create table if not exists public.lounge_bot_publish_log (
  id uuid primary key default gen_random_uuid(),
  bot_user_id uuid not null references public.lounge_bot_accounts (user_id) on delete cascade,
  raw_item_id uuid references public.lounge_news_raw_items (id) on delete set null,
  post_id uuid references public.community_feed_posts (id) on delete set null,
  caption text not null default '',
  score numeric,
  status text not null check (status in ('published', 'skipped', 'failed')),
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists lounge_bot_publish_log_bot_created_idx
  on public.lounge_bot_publish_log (bot_user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RLS (admin read/write; service role bypasses)
-- ---------------------------------------------------------------------------

alter table public.lounge_bot_accounts enable row level security;
alter table public.lounge_news_sources enable row level security;
alter table public.lounge_news_raw_items enable row level security;
alter table public.lounge_bot_publish_log enable row level security;

drop policy if exists lounge_bot_accounts_admin_all on public.lounge_bot_accounts;
create policy lounge_bot_accounts_admin_all on public.lounge_bot_accounts
  for all to authenticated
  using (public.play_log_viewer_is_admin())
  with check (public.play_log_viewer_is_admin());

drop policy if exists lounge_news_sources_admin_all on public.lounge_news_sources;
create policy lounge_news_sources_admin_all on public.lounge_news_sources
  for all to authenticated
  using (public.play_log_viewer_is_admin())
  with check (public.play_log_viewer_is_admin());

drop policy if exists lounge_news_raw_items_admin_all on public.lounge_news_raw_items;
create policy lounge_news_raw_items_admin_all on public.lounge_news_raw_items
  for all to authenticated
  using (public.play_log_viewer_is_admin())
  with check (public.play_log_viewer_is_admin());

drop policy if exists lounge_bot_publish_log_admin_select on public.lounge_bot_publish_log;
create policy lounge_bot_publish_log_admin_select on public.lounge_bot_publish_log
  for select to authenticated
  using (public.play_log_viewer_is_admin());

-- ---------------------------------------------------------------------------
-- Seed default Finnhub sources for a financial-wire bot account
-- ---------------------------------------------------------------------------

create or replace function public.lounge_bot_seed_financial_wire_sources(p_bot_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.play_log_viewer_is_admin() then
    raise exception 'admin only';
  end if;

  if not exists (
    select 1 from public.lounge_bot_accounts a
    where a.user_id = p_bot_user_id and a.slug = 'financial-wire'
  ) then
    raise exception 'lounge_bot_accounts row with slug financial-wire required for %', p_bot_user_id;
  end if;

  insert into public.lounge_news_sources (bot_user_id, name, kind, api_config, poll_interval_sec, enabled)
  select p_bot_user_id, v.name, v.kind, v.api_config, v.poll_interval_sec, true
  from (
    values
      ('Finnhub general market', 'finnhub_general', '{"category":"general"}'::jsonb, 180),
      ('Finnhub M&A', 'finnhub_category', '{"category":"merger"}'::jsonb, 300)
  ) as v(name, kind, api_config, poll_interval_sec)
  where not exists (
    select 1 from public.lounge_news_sources s
    where s.bot_user_id = p_bot_user_id and s.name = v.name
  );
end;
$$;

revoke all on function public.lounge_bot_seed_financial_wire_sources(uuid) from public;
grant execute on function public.lounge_bot_seed_financial_wire_sources(uuid) to authenticated;

comment on function public.lounge_bot_seed_financial_wire_sources(uuid) is
  'Admin: insert default Finnhub sources for financial-wire bot. Call after lounge_bot_accounts insert.';

-- ---------------------------------------------------------------------------
-- Admin ops snapshot (Edge Monitor Bot ops panel)
-- ---------------------------------------------------------------------------

create or replace function public.admin_lounge_bot_ops_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bot record;
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

  select *
  into v_bot
  from public.lounge_bot_accounts a
  where a.slug = 'financial-wire'
  limit 1;

  return jsonb_build_object(
    'generated_at', v_now,
    'financial_wire', case
      when v_bot.user_id is null then jsonb_build_object('configured', false)
      else jsonb_build_object(
        'configured', true,
        'user_id', v_bot.user_id,
        'enabled', v_bot.enabled,
        'display_name', v_bot.display_name,
        'last_poll_at', v_bot.last_poll_at,
        'last_publish_at', v_bot.last_publish_at,
        'max_posts_per_day', v_bot.max_posts_per_day,
        'max_posts_per_hour', v_bot.max_posts_per_hour,
        'publish_score_threshold', v_bot.publish_score_threshold,
        'posts_today', (
          select count(*)::int
          from public.lounge_bot_publish_log l
          where l.bot_user_id = v_bot.user_id
            and l.status = 'published'
            and l.created_at >= v_day_start
        ),
        'posts_last_hour', (
          select count(*)::int
          from public.lounge_bot_publish_log l
          where l.bot_user_id = v_bot.user_id
            and l.status = 'published'
            and l.created_at >= v_hour_start
        ),
        'sources_enabled', (
          select count(*)::int
          from public.lounge_news_sources s
          where s.bot_user_id = v_bot.user_id and s.enabled = true
        ),
        'recent_publishes', coalesce((
          select jsonb_agg(row order by row->>'created_at' desc)
          from (
            select jsonb_build_object(
              'id', l.id,
              'caption', left(l.caption, 200),
              'score', l.score,
              'post_id', l.post_id,
              'created_at', l.created_at
            ) as row
            from public.lounge_bot_publish_log l
            where l.bot_user_id = v_bot.user_id
              and l.status = 'published'
            order by l.created_at desc
            limit 8
          ) sub
        ), '[]'::jsonb),
        'recent_errors', coalesce((
          select jsonb_agg(row order by row->>'created_at' desc)
          from (
            select jsonb_build_object(
              'id', l.id,
              'error_message', l.error_message,
              'created_at', l.created_at
            ) as row
            from public.lounge_bot_publish_log l
            where l.bot_user_id = v_bot.user_id
              and l.status = 'failed'
            order by l.created_at desc
            limit 5
          ) sub
        ), '[]'::jsonb)
      )
    end
  );
end;
$$;

revoke all on function public.admin_lounge_bot_ops_snapshot() from public;
grant execute on function public.admin_lounge_bot_ops_snapshot() to authenticated;

comment on function public.admin_lounge_bot_ops_snapshot() is
  'Edge Monitor: financial wire bot status, caps, recent publishes.';
