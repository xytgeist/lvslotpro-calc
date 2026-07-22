-- Creator fan portal: subscriber list/stats RPCs + new-subscriber activity notifications.

begin;

alter table public.activity_events
  drop constraint if exists activity_events_event_type_check;

alter table public.activity_events
  add constraint activity_events_event_type_check
  check (
    event_type in (
      'comment_on_post',
      'reply_to_comment',
      'mention_in_post',
      'mention_in_comment',
      'follow',
      'repost',
      'quote_repost',
      'bookmark',
      'like',
      'play_log_shared',
      'play_log_partner_paid',
      'play_log_partner_unpaid',
      'chat_dm',
      'chat_group_invite',
      'starter_weekly_guide_drop',
      'creator_fan_sub'
    )
  );

create or replace function public.creator_fan_notify_new_subscriber(
  p_creator_user_id uuid,
  p_subscriber_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_creator_user_id is null or p_subscriber_user_id is null then
    return;
  end if;
  if p_creator_user_id = p_subscriber_user_id then
    return;
  end if;

  perform public.activity_events_insert_safe(
    p_creator_user_id,
    p_subscriber_user_id,
    'creator_fan_sub',
    null,
    null
  );
end;
$$;

revoke all on function public.creator_fan_notify_new_subscriber(uuid, uuid) from public;
grant execute on function public.creator_fan_notify_new_subscriber(uuid, uuid) to service_role;

comment on function public.creator_fan_notify_new_subscriber(uuid, uuid) is
  'In-app (+ push) alert to creator when a fan subscription becomes active. Service role only (Stripe webhook).';

create or replace function public.get_my_creator_fan_subscriber_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'active_count', coalesce((
      select count(*)::int
      from public.creator_subscriptions cs
      where cs.creator_user_id = auth.uid()
        and cs.status in ('active', 'trialing')
    ), 0),
    'pending_cancel_count', coalesce((
      select count(*)::int
      from public.creator_subscriptions cs
      where cs.creator_user_id = auth.uid()
        and cs.status in ('active', 'trialing')
        and cs.cancel_at_period_end
    ), 0),
    'estimated_mrr_cents', coalesce((
      select sum(t.msrp_cents)::int
      from public.creator_subscriptions cs
      join public.creator_fan_tiers t on t.tier_key = cs.fan_tier_key
      where cs.creator_user_id = auth.uid()
        and cs.status in ('active', 'trialing')
    ), 0),
    'enabled', coalesce((
      select cmp.enabled
      from public.creator_monetization_profiles cmp
      where cmp.user_id = auth.uid()
    ), false),
    'connect_onboarding_complete', coalesce((
      select cmp.connect_onboarding_complete
      from public.creator_monetization_profiles cmp
      where cmp.user_id = auth.uid()
    ), false),
    'fan_tier_key', (
      select cmp.fan_tier_key
      from public.creator_monetization_profiles cmp
      where cmp.user_id = auth.uid()
    ),
    'fan_room_id', (
      select cmp.fan_room_id
      from public.creator_monetization_profiles cmp
      where cmp.user_id = auth.uid()
    )
  );
$$;

grant execute on function public.get_my_creator_fan_subscriber_stats() to authenticated;

create or replace function public.list_my_creator_fan_subscribers(
  p_search text default '',
  p_limit integer default 50,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with filtered as (
    select
      cs.subscriber_user_id,
      cs.fan_tier_key,
      cs.status,
      cs.cancel_at_period_end,
      cs.current_period_end,
      cs.created_at,
      p.handle,
      p.display_name,
      p.avatar_url,
      t.msrp_cents
    from public.creator_subscriptions cs
    join public.profiles p on p.user_id = cs.subscriber_user_id
    left join public.creator_fan_tiers t on t.tier_key = cs.fan_tier_key
    where cs.creator_user_id = auth.uid()
      and cs.status in ('active', 'trialing', 'past_due')
      and (
        nullif(btrim(coalesce(p_search, '')), '') is null
        or p.handle ilike '%' || lower(btrim(p_search)) || '%'
        or p.display_name ilike '%' || btrim(p_search) || '%'
      )
    order by cs.created_at desc
    limit greatest(1, least(coalesce(p_limit, 50), 200))
    offset greatest(coalesce(p_offset, 0), 0)
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'subscriber_user_id', f.subscriber_user_id,
        'handle', f.handle,
        'display_name', f.display_name,
        'avatar_url', f.avatar_url,
        'fan_tier_key', f.fan_tier_key,
        'msrp_cents', coalesce(f.msrp_cents, 0),
        'status', f.status,
        'cancel_at_period_end', f.cancel_at_period_end,
        'current_period_end', f.current_period_end,
        'subscribed_at', f.created_at
      )
      order by f.created_at desc
    ),
    '[]'::jsonb
  )
  from filtered f;
$$;

grant execute on function public.list_my_creator_fan_subscribers(text, integer, integer) to authenticated;

commit;
