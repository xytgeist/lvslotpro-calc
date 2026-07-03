-- Edge Monitor phases 2–5: 30/90d trends, top searches, freemium funnel,
-- starter pool stats, live activity pulse RPC.

-- ---------------------------------------------------------------------------
-- Reusable daily trend buckets (N days ending today UTC)
-- ---------------------------------------------------------------------------
create or replace function public.admin_ops_monitor_trends_daily(
  p_days integer,
  p_now timestamptz default now()
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with day_spine as (
    select d.day::date as day
    from generate_series(
      (p_now at time zone 'UTC')::date - (greatest(p_days, 1) - 1),
      (p_now at time zone 'UTC')::date,
      interval '1 day'
    ) as d(day)
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'day', ds.day,
        'label', to_char(ds.day, 'Mon DD'),
        'signups', (
          select count(*)::int
          from public.profiles p
          where (p.created_at at time zone 'UTC')::date = ds.day
        ),
        'posts', (
          select count(*)::int
          from public.community_feed_posts p
          where (p.created_at at time zone 'UTC')::date = ds.day
        ),
        'comments', (
          select count(*)::int
          from public.feed_comments c
          where (c.created_at at time zone 'UTC')::date = ds.day
        ),
        'chat_messages', (
          select count(*)::int
          from public.chat_messages m
          where (m.created_at at time zone 'UTC')::date = ds.day
        ),
        'activity', (
          select count(*)::int
          from public.activity_events ae
          where (ae.created_at at time zone 'UTC')::date = ds.day
        ),
        'searches', (
          select count(*)::int
          from public.lounge_search_analytics a
          where (a.created_at at time zone 'UTC')::date = ds.day
        ),
        'bankroll_sessions', (
          select count(*)::int
          from public.bankroll_sessions s
          where (s.created_at at time zone 'UTC')::date = ds.day
        )
      )
      order by ds.day
    ),
    '[]'::jsonb
  )
  from day_spine ds;
$$;

revoke all on function public.admin_ops_monitor_trends_daily(integer, timestamptz) from public;

-- ---------------------------------------------------------------------------
-- Weekly trend buckets (N weeks ending current UTC week)
-- ---------------------------------------------------------------------------
create or replace function public.admin_ops_monitor_trends_weekly(
  p_weeks integer,
  p_now timestamptz default now()
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with week_spine as (
    select w.week_start::date as week_start
    from generate_series(
      date_trunc('week', timezone('UTC', p_now))::date - ((greatest(p_weeks, 1) - 1) * 7),
      date_trunc('week', timezone('UTC', p_now))::date,
      interval '7 days'
    ) as w(week_start)
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'week_start', ws.week_start,
        'label', to_char(ws.week_start, 'Mon DD'),
        'signups', (
          select count(*)::int
          from public.profiles p
          where date_trunc('week', timezone('UTC', p.created_at))::date = ws.week_start
        ),
        'posts', (
          select count(*)::int
          from public.community_feed_posts p
          where date_trunc('week', timezone('UTC', p.created_at))::date = ws.week_start
        ),
        'activity', (
          select count(*)::int
          from public.activity_events ae
          where date_trunc('week', timezone('UTC', ae.created_at))::date = ws.week_start
        ),
        'chat_messages', (
          select count(*)::int
          from public.chat_messages m
          where date_trunc('week', timezone('UTC', m.created_at))::date = ws.week_start
        ),
        'searches', (
          select count(*)::int
          from public.lounge_search_analytics a
          where date_trunc('week', timezone('UTC', a.created_at))::date = ws.week_start
        )
      )
      order by ws.week_start
    ),
    '[]'::jsonb
  )
  from week_spine ws;
$$;

revoke all on function public.admin_ops_monitor_trends_weekly(integer, timestamptz) from public;

-- ---------------------------------------------------------------------------
-- Top lounge search queries (admin aggregate)
-- ---------------------------------------------------------------------------
create or replace function public.admin_ops_monitor_top_search_queries(
  p_days integer default 7,
  p_limit integer default 15
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'query', s.q,
          'count', s.cnt
        )
        order by s.cnt desc, s.q
      )
      from (
        select
          lower(trim(a.query)) as q,
          count(*)::int as cnt
        from public.lounge_search_analytics a
        where a.created_at >= now() - make_interval(days => greatest(p_days, 1))
          and trim(coalesce(a.query, '')) <> ''
        group by 1
        order by cnt desc, q
        limit greatest(p_limit, 1)
      ) s
    ),
    '[]'::jsonb
  );
$$;

revoke all on function public.admin_ops_monitor_top_search_queries(integer, integer) from public;

-- ---------------------------------------------------------------------------
-- Freemium funnel: free-tier users at 8/9/10 bankroll or play-log cap
-- Mirrors freemiumToolLimits.js (staff + slots-edge pro/lifetime excluded)
-- ---------------------------------------------------------------------------
create or replace function public.admin_ops_monitor_freemium_funnel()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with limited_users as (
    select p.user_id
    from public.profiles p
    where p.role = 'user'
      and not public.user_has_entitlement(p.user_id, 'slots-edge')
      and not public.user_has_entitlement(p.user_id, 'slots-edge-lifetime')
  ),
  bankroll_counts as (
    select bs.user_id, count(*)::int as cnt
    from public.bankroll_sessions bs
    inner join limited_users lu on lu.user_id = bs.user_id
    group by bs.user_id
  ),
  play_log_counts as (
    select e.user_id, count(*)::int as cnt
    from public.play_log_entries e
    inner join limited_users lu on lu.user_id = e.user_id
    group by e.user_id
  )
  select jsonb_build_object(
    'limits', jsonb_build_object(
      'bankroll_cap', 10,
      'play_log_cap', 10
    ),
    'limited_users', (select count(*)::int from limited_users),
    'bankroll', jsonb_build_object(
      'at_8', (select count(*)::int from bankroll_counts where cnt = 8),
      'at_9', (select count(*)::int from bankroll_counts where cnt = 9),
      'at_10', (select count(*)::int from bankroll_counts where cnt >= 10)
    ),
    'play_log', jsonb_build_object(
      'at_8', (select count(*)::int from play_log_counts where cnt = 8),
      'at_9', (select count(*)::int from play_log_counts where cnt = 9),
      'at_10', (select count(*)::int from play_log_counts where cnt >= 10)
    )
  );
$$;

revoke all on function public.admin_ops_monitor_freemium_funnel() from public;

-- ---------------------------------------------------------------------------
-- Starter weekly drop pool stats (aggregate)
-- ---------------------------------------------------------------------------
create or replace function public.admin_ops_monitor_starter_pool_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with eligible as (
    select distinct lower(trim(coalesce(m.slug, g.slug))) as slug
    from public.guides g
    inner join public.machines m on m.id = g.machine_id
    where g.published = true
      and m.release_year >= 2020
      and lower(trim(coalesce(m.slug, g.slug))) <> ''
      and lower(trim(coalesce(m.slug, g.slug))) <> all (
        select unnest(public.starter_weekly_drop_free_guide_slugs())
      )
  ),
  active_starter as (
    select us.user_id
    from public.user_subscriptions us
    where us.product_slug = 'slots-edge-starter'
      and us.status in ('active', 'trialing')
  )
  select jsonb_build_object(
    'pool_size', (select count(*)::int from eligible),
    'active_starter_subs', (select count(*)::int from active_starter),
    'exhausted_starter_subs', (
      select count(*)::int
      from active_starter s
      where public.starter_has_exhausted_weekly_drop_pool(s.user_id)
    )
  );
$$;

revoke all on function public.admin_ops_monitor_starter_pool_stats() from public;

-- ---------------------------------------------------------------------------
-- Live activity pulse (cheap poll target for Phase 5)
-- ---------------------------------------------------------------------------
create or replace function public.admin_ops_monitor_live_pulse()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_1m timestamptz := now() - interval '1 minute';
  v_5m timestamptz := now() - interval '5 minutes';
  v_events_1m int;
  v_events_5m int;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not public.play_log_viewer_is_admin() then
    raise exception 'admin only';
  end if;

  select count(*)::int into v_events_1m
  from public.activity_events ae
  where ae.created_at >= v_1m;

  select count(*)::int into v_events_5m
  from public.activity_events ae
  where ae.created_at >= v_5m;

  return jsonb_build_object(
    'generated_at', now(),
    'events_1m', v_events_1m,
    'events_5m', v_events_5m,
    'rate_per_min', round((v_events_5m::numeric / 5.0), 2),
    'posts_1m', (
      select count(*)::int from public.community_feed_posts p where p.created_at >= v_1m
    ),
    'chat_messages_1m', (
      select count(*)::int from public.chat_messages m where m.created_at >= v_1m
    )
  );
end;
$$;

grant execute on function public.admin_ops_monitor_live_pulse() to authenticated;

comment on function public.admin_ops_monitor_live_pulse() is
  'Admin-only lightweight counters for Edge Monitor live pulse (poll every ~15s).';

-- ---------------------------------------------------------------------------
-- Extend 7d helper to delegate to daily trends (keeps prior signature)
-- ---------------------------------------------------------------------------
create or replace function public.admin_ops_monitor_trends_7d(p_now timestamptz default now())
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public.admin_ops_monitor_trends_daily(7, p_now);
$$;

-- ---------------------------------------------------------------------------
-- Snapshot: add phase 2 fields
-- ---------------------------------------------------------------------------
create or replace function public.admin_ops_monitor_snapshot()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_24h timestamptz := v_now - interval '24 hours';
  v_7d timestamptz := v_now - interval '7 days';
  v_pool jsonb := public.admin_ops_monitor_starter_pool_stats();
  v_body jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if not public.play_log_viewer_is_admin() then
    raise exception 'admin only';
  end if;

  v_body := jsonb_build_object(
    'generated_at', v_now,
    'users', jsonb_build_object(
      'total_profiles', (select count(*)::int from public.profiles),
      'new_24h', (select count(*)::int from public.profiles p where p.created_at >= v_24h),
      'new_7d', (select count(*)::int from public.profiles p where p.created_at >= v_7d),
      'role_user', (select count(*)::int from public.profiles p where p.role = 'user'),
      'role_moderator', (select count(*)::int from public.profiles p where p.role = 'moderator'),
      'role_admin', (select count(*)::int from public.profiles p where p.role = 'admin'),
      'has_active_subscription_flag', (
        select count(*)::int from public.profiles p where p.has_active_subscription = true
      ),
      'stripe_customer_linked', (
        select count(*)::int from public.profiles p where p.stripe_customer_id is not null
      )
    ),
    'subscriptions', jsonb_build_object(
      'rows_total', (select count(*)::int from public.user_subscriptions),
      'active_by_product', coalesce((
        select jsonb_agg(jsonb_build_object('product_slug', s.product_slug, 'count', s.cnt) order by s.product_slug)
        from (
          select us.product_slug, count(*)::int as cnt
          from public.user_subscriptions us
          where us.status in ('active', 'trialing')
          group by us.product_slug
        ) s
      ), '[]'::jsonb),
      'status_breakdown', coalesce((
        select jsonb_agg(jsonb_build_object('status', s.status, 'count', s.cnt) order by s.status)
        from (
          select us.status, count(*)::int as cnt
          from public.user_subscriptions us
          group by us.status
        ) s
      ), '[]'::jsonb),
      'cancel_at_period_end', (
        select count(*)::int from public.user_subscriptions us
        where us.cancel_at_period_end = true and us.status in ('active', 'trialing')
      ),
      'monthly_interval', (
        select count(*)::int from public.user_subscriptions us
        where us.price_interval = 'monthly' and us.status in ('active', 'trialing')
      ),
      'annual_interval', (
        select count(*)::int from public.user_subscriptions us
        where us.price_interval = 'annual' and us.status in ('active', 'trialing')
      )
    ),
    'lounge', jsonb_build_object(
      'posts_total', (select count(*)::int from public.community_feed_posts),
      'posts_visible', (
        select count(*)::int from public.community_feed_posts p where p.hidden_at is null
      ),
      'posts_hidden', (
        select count(*)::int from public.community_feed_posts p where p.hidden_at is not null
      ),
      'posts_24h', (
        select count(*)::int from public.community_feed_posts p where p.created_at >= v_24h
      ),
      'posts_7d', (
        select count(*)::int from public.community_feed_posts p where p.created_at >= v_7d
      ),
      'pinned', (
        select count(*)::int from public.community_feed_posts p
        where p.pinned = true and p.hidden_at is null
      ),
      'with_stream_video', (
        select count(*)::int from public.community_feed_posts p where p.stream_video_uid is not null
      ),
      'comments_total', (select count(*)::int from public.feed_comments),
      'comments_24h', (
        select count(*)::int from public.feed_comments c where c.created_at >= v_24h
      ),
      'likes_total', (select count(*)::int from public.post_likes),
      'bookmarks_total', (select count(*)::int from public.post_bookmarks),
      'follows_total', (select count(*)::int from public.profile_follows)
    ),
    'search', jsonb_build_object(
      'searches_24h', (
        select count(*)::int from public.lounge_search_analytics a where a.created_at >= v_24h
      ),
      'searches_7d', (
        select count(*)::int from public.lounge_search_analytics a where a.created_at >= v_7d
      ),
      'unique_searchers_24h', (
        select count(distinct a.user_id)::int
        from public.lounge_search_analytics a
        where a.created_at >= v_24h and a.user_id is not null
      ),
      'top_queries_7d', public.admin_ops_monitor_top_search_queries(7, 15),
      'top_queries_30d', public.admin_ops_monitor_top_search_queries(30, 15)
    ),
    'rate_limits', jsonb_build_object(
      'events_24h', (
        select count(*)::int from public.rate_limit_events e where e.created_at >= v_24h
      ),
      'events_7d', (
        select count(*)::int from public.rate_limit_events e where e.created_at >= v_7d
      ),
      'by_kind_24h', coalesce((
        select jsonb_agg(jsonb_build_object('kind', k.kind, 'count', k.cnt) order by k.cnt desc, k.kind)
        from (
          select e.kind, count(*)::int as cnt
          from public.rate_limit_events e
          where e.created_at >= v_24h
          group by e.kind
        ) k
      ), '[]'::jsonb)
    ),
    'chat', jsonb_build_object(
      'rooms_total', (select count(*)::int from public.chat_rooms),
      'messages_total', (select count(*)::int from public.chat_messages),
      'messages_24h', (
        select count(*)::int from public.chat_messages m where m.created_at >= v_24h
      ),
      'messages_7d', (
        select count(*)::int from public.chat_messages m where m.created_at >= v_7d
      ),
      'members_total', (select count(*)::int from public.chat_room_members)
    ),
    'guides', jsonb_build_object(
      'published', (select count(*)::int from public.guides g where g.published = true),
      'unpublished', (select count(*)::int from public.guides g where g.published = false),
      'machines_total', (select count(*)::int from public.machines)
    ),
    'bankroll', jsonb_build_object(
      'sessions_total', (select count(*)::int from public.bankroll_sessions),
      'sessions_7d', (
        select count(*)::int from public.bankroll_sessions s where s.created_at >= v_7d
      ),
      'profiles_with_sessions', (
        select count(distinct s.user_id)::int from public.bankroll_sessions s
      )
    ),
    'play_log', jsonb_build_object(
      'entries_total', (select count(*)::int from public.play_log_entries),
      'entries_7d', (
        select count(*)::int from public.play_log_entries e where e.created_at >= v_7d
      ),
      'users_with_entries', (
        select count(distinct e.user_id)::int from public.play_log_entries e
      )
    ),
    'offers', jsonb_build_object(
      'events_total', (select count(*)::int from public.offer_events),
      'uploads_total', (select count(*)::int from public.offer_uploads)
    ),
    'push', jsonb_build_object(
      'subscriptions_total', (select count(*)::int from public.push_subscriptions)
    ),
    'starter_drops', jsonb_build_object(
      'unlocks_total', (select count(*)::int from public.starter_weekly_guide_unlocks),
      'pending_reveal', (
        select count(*)::int from public.starter_weekly_guide_unlocks u
        where u.scratch_revealed_at is null
      ),
      'grants_7d', (
        select count(*)::int from public.starter_weekly_guide_unlocks u where u.granted_at >= v_7d
      ),
      'pool_size', v_pool->'pool_size',
      'active_starter_subs', v_pool->'active_starter_subs',
      'exhausted_starter_subs', v_pool->'exhausted_starter_subs'
    ),
    'freemium_funnel', public.admin_ops_monitor_freemium_funnel(),
    'activity', jsonb_build_object(
      'events_24h', (
        select count(*)::int from public.activity_events ae where ae.created_at >= v_24h
      ),
      'events_7d', (
        select count(*)::int from public.activity_events ae where ae.created_at >= v_7d
      )
    ),
    'stripe_webhooks', jsonb_build_object(
      'events_24h', (
        select count(*)::int from public.stripe_webhook_events w where w.received_at >= v_24h
      ),
      'events_7d', (
        select count(*)::int from public.stripe_webhook_events w where w.received_at >= v_7d
      )
    ),
    'trends', public.admin_ops_monitor_trends_7d(v_now),
    'trends_30d', public.admin_ops_monitor_trends_daily(30, v_now),
    'trends_90d', public.admin_ops_monitor_trends_weekly(13, v_now)
  );

  return v_body;
end;
$$;

comment on function public.admin_ops_monitor_trends_daily(integer, timestamptz) is
  'UTC daily buckets for Edge Monitor extended charts.';
comment on function public.admin_ops_monitor_trends_weekly(integer, timestamptz) is
  'UTC weekly buckets for Edge Monitor 90-day charts.';
comment on function public.admin_ops_monitor_top_search_queries(integer, integer) is
  'Admin aggregate of lounge_search_analytics.query counts.';
comment on function public.admin_ops_monitor_freemium_funnel() is
  'Free-tier users at bankroll/play-log caps (8/9/10). Mirrors freemiumToolLimits.js.';
comment on function public.admin_ops_monitor_starter_pool_stats() is
  'Starter weekly drop pool size + exhausted active starter subs.';
comment on function public.admin_ops_monitor_snapshot() is
  'Admin-only JSON snapshot for Edge Monitor (phases 1–2 metrics + 7/30/90d trends).';
