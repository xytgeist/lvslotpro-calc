-- Fix subscriber list when tier row missing (LEFT JOIN); safe to re-run.

begin;

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

commit;
