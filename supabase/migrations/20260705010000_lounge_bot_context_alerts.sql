-- Context alert post kinds: starters, injuries, rest/travel (factual Rundown + odds data).

alter table public.lounge_bot_odds_config
  add column if not exists starter_spotlight_enabled boolean not null default true;
alter table public.lounge_bot_odds_config
  add column if not exists confirmed_starters_enabled boolean not null default true;
alter table public.lounge_bot_odds_config
  add column if not exists injury_impact_enabled boolean not null default true;
alter table public.lounge_bot_odds_config
  add column if not exists rest_travel_edge_enabled boolean not null default true;
alter table public.lounge_bot_odds_config
  add column if not exists fade_the_public_enabled boolean not null default false;
alter table public.lounge_bot_odds_config
  add column if not exists max_context_alerts_per_day integer not null default 8
    check (max_context_alerts_per_day between 1 and 24);

comment on column public.lounge_bot_odds_config.fade_the_public_enabled is
  'Requires public betting % feed  off until wired.';

update public.lounge_bot_odds_config
set alert_audience = alert_audience || '{
  "starter_spotlight": "subscribers",
  "confirmed_starters": "subscribers",
  "injury_impact": "subscribers",
  "rest_travel_edge": "subscribers",
  "fade_the_public": "subscribers"
}'::jsonb
where not (alert_audience ? 'starter_spotlight');

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
  v_handle text;
  v_display_name text;
  v_min_edge numeric;
  v_key text;
  v_val text;
  v_merged jsonb;
  v_live_edge numeric;
  v_hour_ev numeric;
  v_arb_pct numeric;
  v_radar_ev numeric;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.play_log_viewer_is_admin() then raise exception 'admin only'; end if;
  if p_user_id is null then raise exception 'p_user_id required'; end if;

  select * into v_row from public.lounge_bot_accounts where user_id = p_user_id;
  if not found then raise exception 'bot not found'; end if;

  v_config := coalesce(v_row.config, '{}'::jsonb);
  if p_patch ? 'config' and jsonb_typeof(p_patch->'config') = 'object' then
    v_config := v_config || (p_patch->'config');
  end if;

  if p_patch ? 'handle' then
    v_handle := lower(trim(p_patch->>'handle'));
    if v_handle is not null and v_handle <> '' and v_handle !~ '^[a-z0-9_]{2,30}$' then
      raise exception 'invalid handle';
    end if;
  end if;

  v_display_name := case
    when p_patch ? 'display_name' then nullif(trim(p_patch->>'display_name'), '')
    else null
  end;

  update public.lounge_bot_accounts
  set
    run_state = coalesce(nullif(p_patch->>'run_state', ''), run_state),
    display_name = coalesce(v_display_name, display_name),
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

  update public.profiles
  set
    display_name = coalesce(v_display_name, display_name),
    handle = case when p_patch ? 'handle' then coalesce(nullif(v_handle, ''), handle) else handle end,
    avatar_url = case when p_patch ? 'avatar_url' then nullif(p_patch->>'avatar_url', '') else avatar_url end,
    banner_url = case when p_patch ? 'banner_url' then nullif(p_patch->>'banner_url', '') else banner_url end,
    bio = case when p_patch ? 'bio' then left(nullif(trim(p_patch->>'bio'), ''), 160) else bio end,
    about_me = case when p_patch ? 'about_me' then left(nullif(trim(p_patch->>'about_me'), ''), 140) else about_me end,
    category_pills = case
      when p_patch ? 'category_pills' and jsonb_typeof(p_patch->'category_pills') = 'array'
        then coalesce(
          (select array_agg(distinct value)::text[] from jsonb_array_elements_text(p_patch->'category_pills')),
          category_pills
        )
      else category_pills
    end
  where user_id = p_user_id;

  if p_patch ? 'min_edge_pct' then
    if v_row.pipeline <> 'odds_api' then raise exception 'min_edge_pct applies to odds_api bots only'; end if;
    v_min_edge := (p_patch->>'min_edge_pct')::numeric;
    if v_min_edge is null or v_min_edge < 0.5 or v_min_edge > 15 then
      raise exception 'min_edge_pct must be between 0.5 and 15';
    end if;
    update public.lounge_bot_odds_config set min_edge_pct = round(v_min_edge, 2) where bot_user_id = p_user_id;
    if not found then raise exception 'odds config not found for this bot'; end if;
  end if;

  if p_patch ? 'alert_audience' then
    if v_row.pipeline <> 'odds_api' then raise exception 'alert_audience applies to odds_api bots only'; end if;
    if jsonb_typeof(p_patch->'alert_audience') <> 'object' then raise exception 'alert_audience must be a JSON object'; end if;
    select coalesce(o.alert_audience, '{}'::jsonb) into v_merged from public.lounge_bot_odds_config o where o.bot_user_id = p_user_id;
    if not found then raise exception 'odds config not found for this bot'; end if;
    for v_key, v_val in select key, value #>> '{}' from jsonb_each(p_patch->'alert_audience') loop
      if v_key not in (
        'coffee_covers', 'edge', 'line_movement', 'in_game_edge', 'period_report',
        'best_bet_hour', 'arb_watch', 'sharp_report', 'value_bet_radar',
        'starter_spotlight', 'confirmed_starters', 'injury_impact', 'rest_travel_edge', 'fade_the_public'
      ) then
        raise exception 'invalid alert_audience key: %', v_key;
      end if;
      if v_val not in ('all', 'subscribers') then raise exception 'alert_audience.% must be all or subscribers', v_key; end if;
      v_merged := v_merged || jsonb_build_object(v_key, v_val);
    end loop;
    update public.lounge_bot_odds_config set alert_audience = v_merged where bot_user_id = p_user_id;
  end if;

  if p_patch ? 'live_edge_enabled' or p_patch ? 'period_report_enabled'
     or p_patch ? 'min_live_edge_pct' or p_patch ? 'max_live_alerts_per_day'
     or p_patch ? 'max_period_reports_per_day' then
    if v_row.pipeline <> 'odds_api' then raise exception 'live content settings apply to odds_api bots only'; end if;
    if p_patch ? 'min_live_edge_pct' then
      v_live_edge := (p_patch->>'min_live_edge_pct')::numeric;
      if v_live_edge is null or v_live_edge < 2 or v_live_edge > 15 then raise exception 'min_live_edge_pct must be between 2 and 15'; end if;
    end if;
    update public.lounge_bot_odds_config
    set
      live_edge_enabled = case when p_patch ? 'live_edge_enabled' then (p_patch->>'live_edge_enabled')::boolean else live_edge_enabled end,
      period_report_enabled = case when p_patch ? 'period_report_enabled' then (p_patch->>'period_report_enabled')::boolean else period_report_enabled end,
      min_live_edge_pct = case when p_patch ? 'min_live_edge_pct' then round((p_patch->>'min_live_edge_pct')::numeric, 2) else min_live_edge_pct end,
      max_live_alerts_per_day = case when p_patch ? 'max_live_alerts_per_day' then (p_patch->>'max_live_alerts_per_day')::int else max_live_alerts_per_day end,
      max_period_reports_per_day = case when p_patch ? 'max_period_reports_per_day' then (p_patch->>'max_period_reports_per_day')::int else max_period_reports_per_day end
    where bot_user_id = p_user_id;
    if not found then raise exception 'odds config not found for this bot'; end if;
  end if;

  if p_patch ? 'best_bet_hour_enabled' or p_patch ? 'min_best_bet_hour_ev_pct' then
    if v_row.pipeline <> 'odds_api' then raise exception 'best bet hour settings apply to odds_api bots only'; end if;
    if p_patch ? 'min_best_bet_hour_ev_pct' then
      v_hour_ev := (p_patch->>'min_best_bet_hour_ev_pct')::numeric;
      if v_hour_ev is null or v_hour_ev < 2 or v_hour_ev > 15 then raise exception 'min_best_bet_hour_ev_pct must be between 2 and 15'; end if;
    end if;
    update public.lounge_bot_odds_config
    set
      best_bet_hour_enabled = case when p_patch ? 'best_bet_hour_enabled' then (p_patch->>'best_bet_hour_enabled')::boolean else best_bet_hour_enabled end,
      min_best_bet_hour_ev_pct = case when p_patch ? 'min_best_bet_hour_ev_pct' then round((p_patch->>'min_best_bet_hour_ev_pct')::numeric, 2) else min_best_bet_hour_ev_pct end
    where bot_user_id = p_user_id;
    if not found then raise exception 'odds config not found for this bot'; end if;
  end if;

  if p_patch ? 'arb_watch_enabled' or p_patch ? 'min_arb_profit_pct' or p_patch ? 'max_arb_alerts_per_day' then
    if v_row.pipeline <> 'odds_api' then raise exception 'arb watch settings apply to odds_api bots only'; end if;
    if p_patch ? 'min_arb_profit_pct' then
      v_arb_pct := (p_patch->>'min_arb_profit_pct')::numeric;
      if v_arb_pct is null or v_arb_pct < 1 or v_arb_pct > 10 then raise exception 'min_arb_profit_pct must be between 1 and 10'; end if;
    end if;
    update public.lounge_bot_odds_config
    set
      arb_watch_enabled = case when p_patch ? 'arb_watch_enabled' then (p_patch->>'arb_watch_enabled')::boolean else arb_watch_enabled end,
      min_arb_profit_pct = case when p_patch ? 'min_arb_profit_pct' then round((p_patch->>'min_arb_profit_pct')::numeric, 2) else min_arb_profit_pct end,
      max_arb_alerts_per_day = case when p_patch ? 'max_arb_alerts_per_day' then (p_patch->>'max_arb_alerts_per_day')::int else max_arb_alerts_per_day end
    where bot_user_id = p_user_id;
    if not found then raise exception 'odds config not found for this bot'; end if;
  end if;

  if p_patch ? 'sharp_report_enabled' or p_patch ? 'max_sharp_reports_per_day' then
    if v_row.pipeline <> 'odds_api' then raise exception 'sharp report settings apply to odds_api bots only'; end if;
    update public.lounge_bot_odds_config
    set
      sharp_report_enabled = case when p_patch ? 'sharp_report_enabled' then (p_patch->>'sharp_report_enabled')::boolean else sharp_report_enabled end,
      max_sharp_reports_per_day = case when p_patch ? 'max_sharp_reports_per_day' then (p_patch->>'max_sharp_reports_per_day')::int else max_sharp_reports_per_day end
    where bot_user_id = p_user_id;
    if not found then raise exception 'odds config not found for this bot'; end if;
  end if;

  if p_patch ? 'value_bet_radar_enabled' or p_patch ? 'min_value_bet_radar_ev_pct'
     or p_patch ? 'max_value_bet_radar_posts_per_day' then
    if v_row.pipeline <> 'odds_api' then raise exception 'value bet radar settings apply to odds_api bots only'; end if;
    if p_patch ? 'min_value_bet_radar_ev_pct' then
      v_radar_ev := (p_patch->>'min_value_bet_radar_ev_pct')::numeric;
      if v_radar_ev is null or v_radar_ev < 2 or v_radar_ev > 15 then raise exception 'min_value_bet_radar_ev_pct must be between 2 and 15'; end if;
    end if;
    update public.lounge_bot_odds_config
    set
      value_bet_radar_enabled = case when p_patch ? 'value_bet_radar_enabled' then (p_patch->>'value_bet_radar_enabled')::boolean else value_bet_radar_enabled end,
      min_value_bet_radar_ev_pct = case when p_patch ? 'min_value_bet_radar_ev_pct' then round((p_patch->>'min_value_bet_radar_ev_pct')::numeric, 2) else min_value_bet_radar_ev_pct end,
      max_value_bet_radar_posts_per_day = case when p_patch ? 'max_value_bet_radar_posts_per_day' then (p_patch->>'max_value_bet_radar_posts_per_day')::int else max_value_bet_radar_posts_per_day end
    where bot_user_id = p_user_id;
    if not found then raise exception 'odds config not found for this bot'; end if;
  end if;


  if p_patch ? 'starter_spotlight_enabled' or p_patch ? 'confirmed_starters_enabled'
     or p_patch ? 'injury_impact_enabled' or p_patch ? 'rest_travel_edge_enabled'
     or p_patch ? 'fade_the_public_enabled' or p_patch ? 'max_context_alerts_per_day' then
    if v_row.pipeline <> 'odds_api' then raise exception 'context alert settings apply to odds_api bots only'; end if;
    update public.lounge_bot_odds_config
    set
      starter_spotlight_enabled = case when p_patch ? 'starter_spotlight_enabled' then (p_patch->>'starter_spotlight_enabled')::boolean else starter_spotlight_enabled end,
      confirmed_starters_enabled = case when p_patch ? 'confirmed_starters_enabled' then (p_patch->>'confirmed_starters_enabled')::boolean else confirmed_starters_enabled end,
      injury_impact_enabled = case when p_patch ? 'injury_impact_enabled' then (p_patch->>'injury_impact_enabled')::boolean else injury_impact_enabled end,
      rest_travel_edge_enabled = case when p_patch ? 'rest_travel_edge_enabled' then (p_patch->>'rest_travel_edge_enabled')::boolean else rest_travel_edge_enabled end,
      fade_the_public_enabled = case when p_patch ? 'fade_the_public_enabled' then (p_patch->>'fade_the_public_enabled')::boolean else fade_the_public_enabled end,
      max_context_alerts_per_day = case when p_patch ? 'max_context_alerts_per_day' then (p_patch->>'max_context_alerts_per_day')::int else max_context_alerts_per_day end
    where bot_user_id = p_user_id;
    if not found then raise exception 'odds config not found for this bot'; end if;
  end if;
  return jsonb_build_object(
    'ok', true,
    'user_id', v_row.user_id,
    'run_state', v_row.run_state,
    'max_posts_per_day', v_row.max_posts_per_day,
    'max_posts_per_hour', v_row.max_posts_per_hour,
    'publish_score_threshold', v_row.publish_score_threshold,
    'min_edge_pct', (select o.min_edge_pct from public.lounge_bot_odds_config o where o.bot_user_id = p_user_id),
    'alert_audience', (select o.alert_audience from public.lounge_bot_odds_config o where o.bot_user_id = p_user_id)
  );
end;
$$;

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
    'editorial_pending', (select count(*)::int from public.lounge_bot_queue q where q.status = 'pending_review'),
    'editorial_scheduled', (select count(*)::int from public.lounge_bot_queue q where q.status = 'scheduled'),
    'bots', coalesce((
      select jsonb_agg(bot_row order by bot_row->>'slug')
      from (
        select jsonb_build_object(
          'user_id', a.user_id, 'slug', a.slug, 'pipeline', a.pipeline, 'review_mode', a.review_mode,
          'display_name', a.display_name, 'run_state', a.run_state, 'enabled', a.enabled,
          'max_posts_per_day', a.max_posts_per_day, 'max_posts_per_hour', a.max_posts_per_hour,
          'publish_score_threshold', a.publish_score_threshold,
          'category_pills_default', coalesce(a.category_pills_default, '{}'::text[]),
          'config', coalesce(a.config, '{}'::jsonb),
          'last_poll_at', a.last_poll_at, 'last_publish_at', a.last_publish_at, 'created_at', a.created_at,
          'handle', p.handle, 'avatar_url', p.avatar_url, 'banner_url', p.banner_url,
          'bio', p.bio, 'about_me', p.about_me, 'is_bot', coalesce(p.is_bot, false),
          'pending_review', (select count(*)::int from public.lounge_bot_queue q where q.bot_user_id = a.user_id and q.status = 'pending_review'),
          'posts_today', (select count(*)::int from public.lounge_bot_publish_log l where l.bot_user_id = a.user_id and l.status = 'published' and l.created_at >= v_day_start),
          'posts_last_hour', (select count(*)::int from public.lounge_bot_publish_log l where l.bot_user_id = a.user_id and l.status = 'published' and l.created_at >= v_hour_start),
          'scheduled_posts_pending', (select count(*)::int from public.lounge_bot_scheduled_posts s where s.bot_user_id = a.user_id and s.status = 'pending'),
          'odds_config', (
            select jsonb_build_object(
              'min_edge_pct', o.min_edge_pct, 'sports_keys', o.sports_keys, 'regions', o.regions, 'markets', o.markets,
              'max_picks_per_run', o.max_picks_per_run, 'max_edge_alerts_per_day', o.max_edge_alerts_per_day,
              'max_slate_posts_per_day', o.max_slate_posts_per_day, 'daily_slate_enabled', o.daily_slate_enabled,
              'coffee_covers_enabled', o.coffee_covers_enabled, 'line_movement_enabled', o.line_movement_enabled,
              'max_line_alerts_per_day', o.max_line_alerts_per_day, 'min_spread_move_pts', o.min_spread_move_pts,
              'min_total_move_pts', o.min_total_move_pts, 'min_ml_move_pts', o.min_ml_move_pts,
              'alert_audience', o.alert_audience, 'live_edge_enabled', o.live_edge_enabled,
              'period_report_enabled', o.period_report_enabled, 'min_live_edge_pct', o.min_live_edge_pct,
              'max_live_alerts_per_day', o.max_live_alerts_per_day, 'max_period_reports_per_day', o.max_period_reports_per_day,
              'best_bet_hour_enabled', o.best_bet_hour_enabled, 'min_best_bet_hour_ev_pct', o.min_best_bet_hour_ev_pct,
              'arb_watch_enabled', o.arb_watch_enabled, 'min_arb_profit_pct', o.min_arb_profit_pct,
              'max_arb_alerts_per_day', o.max_arb_alerts_per_day,
              'sharp_report_enabled', o.sharp_report_enabled, 'max_sharp_reports_per_day', o.max_sharp_reports_per_day,
              'value_bet_radar_enabled', o.value_bet_radar_enabled,
              'min_value_bet_radar_ev_pct', o.min_value_bet_radar_ev_pct,
              'max_value_bet_radar_posts_per_day', o.max_value_bet_radar_posts_per_day,
              'starter_spotlight_enabled', o.starter_spotlight_enabled,
              'confirmed_starters_enabled', o.confirmed_starters_enabled,
              'injury_impact_enabled', o.injury_impact_enabled,
              'rest_travel_edge_enabled', o.rest_travel_edge_enabled,
              'fade_the_public_enabled', o.fade_the_public_enabled,
              'max_context_alerts_per_day', o.max_context_alerts_per_day,
              'min_post_gap_minutes', o.min_post_gap_minutes,
              'enabled', o.enabled
            )
            from public.lounge_bot_odds_config o where o.bot_user_id = a.user_id
          ),
          'sources', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', s.id, 'name', s.name, 'kind', s.kind, 'enabled', s.enabled,
              'poll_interval_sec', s.poll_interval_sec, 'last_polled_at', s.last_polled_at, 'last_error', s.last_error
            ) order by s.name) from public.lounge_news_sources s where s.bot_user_id = a.user_id
          ), '[]'::jsonb),
          'x_sources', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', xs.id, 'x_handle', xs.x_handle, 'enabled', xs.enabled,
              'last_polled_at', xs.last_polled_at, 'last_error', xs.last_error
            ) order by xs.x_handle) from public.lounge_bot_x_sources xs where xs.bot_user_id = a.user_id
          ), '[]'::jsonb),
          'recent_posts', coalesce((
            select jsonb_agg(jsonb_build_object(
              'post_id', c.id, 'caption', c.caption, 'category_pills', coalesce(c.category_pills, '{}'::text[]),
              'subscriber_only', coalesce(c.subscriber_only, false), 'created_at', c.created_at,
              'edited_at', c.edited_at, 'like_count', c.like_count, 'comment_count', c.comment_count
            ) order by c.created_at desc)
            from (select c.* from public.community_feed_posts c where c.user_id = a.user_id and c.hidden_at is null order by c.created_at desc limit 20) c
          ), '[]'::jsonb),
          'recent_log', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', l.id, 'status', l.status, 'caption', left(l.caption, 240), 'score', l.score,
              'post_id', l.post_id, 'post_kind', l.post_kind, 'error_message', l.error_message, 'created_at', l.created_at
            ) order by l.created_at desc)
            from (select l.* from public.lounge_bot_publish_log l where l.bot_user_id = a.user_id order by l.created_at desc limit 15) l
          ), '[]'::jsonb)
        ) as bot_row
        from public.lounge_bot_accounts a
        left join public.profiles p on p.user_id = a.user_id
      ) sub
    ), '[]'::jsonb)
  );
end;
$$;
