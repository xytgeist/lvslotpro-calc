-- Major sports betting calendar for odds bot manual slate picker (admin portal).

create table if not exists public.lounge_sports_betting_calendar (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label_short text not null,
  title text not null,
  odds_sport_keys text[] not null,
  kind text not null default 'season' check (kind in ('tournament', 'season', 'marquee')),
  start_date date not null,
  end_date date not null,
  priority integer not null default 50 check (priority between 0 and 100),
  caption_prefix text,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  constraint lounge_sports_betting_calendar_dates check (end_date >= start_date)
);

create index if not exists lounge_sports_betting_calendar_active_idx
  on public.lounge_sports_betting_calendar (enabled, start_date, end_date, priority desc);

alter table public.lounge_sports_betting_calendar enable row level security;

drop policy if exists lounge_sports_betting_calendar_admin_all on public.lounge_sports_betting_calendar;
create policy lounge_sports_betting_calendar_admin_all on public.lounge_sports_betting_calendar
  for all to authenticated
  using (public.play_log_viewer_is_admin())
  with check (public.play_log_viewer_is_admin());

comment on table public.lounge_sports_betting_calendar is
  'Admin-managed major betting windows. Powers odds bot portal dropdown (today''s slate).';

-- ---------------------------------------------------------------------------
-- 2026 seed (PT date windows; extend yearly)
-- ---------------------------------------------------------------------------

insert into public.lounge_sports_betting_calendar
  (slug, label_short, title, odds_sport_keys, kind, start_date, end_date, priority, caption_prefix)
values
  (
    'fifa-world-cup-2026',
    'World Cup',
    'FIFA World Cup 2026',
    array['soccer_fifa_world_cup']::text[],
    'tournament',
    '2026-06-11',
    '2026-07-19',
    100,
    'World Cup'
  ),
  (
    'mlb-2026',
    'MLB',
    'MLB Regular Season 2026',
    array['baseball_mlb']::text[],
    'season',
    '2026-03-27',
    '2026-10-31',
    70,
    'MLB'
  ),
  (
    'wnba-2026',
    'WNBA',
    'WNBA 2026',
    array['basketball_wnba']::text[],
    'season',
    '2026-05-01',
    '2026-10-20',
    55,
    'WNBA'
  ),
  (
    'nba-2026',
    'NBA',
    'NBA 2025-26 Season',
    array['basketball_nba']::text[],
    'season',
    '2025-10-21',
    '2026-06-30',
    65,
    'NBA'
  ),
  (
    'nfl-2026',
    'NFL',
    'NFL 2026 Season',
    array['americanfootball_nfl']::text[],
    'season',
    '2026-09-03',
    '2027-02-15',
    80,
    'NFL'
  ),
  (
    'nfl-preseason-2026',
    'NFL Preseason',
    'NFL Preseason 2026',
    array['americanfootball_nfl_preseason']::text[],
    'season',
    '2026-08-01',
    '2026-09-02',
    45,
    'NFL Preseason'
  ),
  (
    'ncaaf-2026',
    'NCAAF',
    'College Football 2026',
    array['americanfootball_ncaaf']::text[],
    'season',
    '2026-08-23',
    '2027-01-20',
    75,
    'NCAAF'
  ),
  (
    'march-madness-2026',
    'March Madness',
    'NCAA Men''s Basketball Tournament 2026',
    array['basketball_ncaab']::text[],
    'tournament',
    '2026-03-17',
    '2026-04-07',
    90,
    'March Madness'
  ),
  (
    'wimbledon-2026',
    'Wimbledon',
    'Wimbledon 2026',
    array['tennis_atp_wimbledon']::text[],
    'tournament',
    '2026-06-29',
    '2026-07-12',
    60,
    'Wimbledon'
  ),
  (
    'us-open-tennis-2026',
    'US Open Tennis',
    'US Open Tennis 2026',
    array['tennis_atp_us_open']::text[],
    'tournament',
    '2026-08-24',
    '2026-09-13',
    60,
    'US Open Tennis'
  ),
  (
    'nhl-2026',
    'NHL',
    'NHL 2025-26 Season',
    array['icehockey_nhl']::text[],
    'season',
    '2025-10-07',
    '2026-06-30',
    50,
    'NHL'
  )
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- RPC: today's major events (America/Los_Angeles calendar day)
-- ---------------------------------------------------------------------------

create or replace function public.admin_lounge_sports_betting_calendar_today()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('America/Los_Angeles', now()))::date;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.play_log_viewer_is_admin() then raise exception 'admin only'; end if;

  return coalesce((
    select jsonb_agg(row_obj order by (row_obj->>'priority')::int desc, row_obj->>'label_short')
    from (
      select jsonb_build_object(
        'slug', c.slug,
        'label_short', c.label_short,
        'title', c.title,
        'odds_sport_keys', c.odds_sport_keys,
        'kind', c.kind,
        'priority', c.priority,
        'caption_prefix', coalesce(c.caption_prefix, c.label_short),
        'start_date', c.start_date,
        'end_date', c.end_date
      ) as row_obj
      from public.lounge_sports_betting_calendar c
      where c.enabled
        and v_today between c.start_date and c.end_date
    ) sub
  ), '[]'::jsonb);
end;
$$;

revoke all on function public.admin_lounge_sports_betting_calendar_today() from public;
grant execute on function public.admin_lounge_sports_betting_calendar_today() to authenticated;

comment on function public.admin_lounge_sports_betting_calendar_today() is
  'Admin portal: major betting calendar entries active today (PT).';

-- Extend bot portal snapshot with odds_config for sports bots.
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
          'banner_url', p.banner_url,
          'bio', p.bio,
          'about_me', p.about_me,
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
          'odds_config', (
            select jsonb_build_object(
              'min_edge_pct', o.min_edge_pct,
              'sports_keys', o.sports_keys,
              'regions', o.regions,
              'markets', o.markets,
              'max_picks_per_run', o.max_picks_per_run,
              'enabled', o.enabled
            )
            from public.lounge_bot_odds_config o
            where o.bot_user_id = a.user_id
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
