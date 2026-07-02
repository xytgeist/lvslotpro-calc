-- Persist Stripe billing cadence on subscription rows for subscribe-modal interval UX.

alter table public.user_subscriptions
  add column if not exists price_interval text;

alter table public.user_subscriptions
  drop constraint if exists user_subscriptions_price_interval_check;

alter table public.user_subscriptions
  add constraint user_subscriptions_price_interval_check
  check (price_interval is null or price_interval in ('monthly', 'annual'));

comment on column public.user_subscriptions.price_interval is
  'Stripe billing cadence (monthly or annual). Synced from subscription metadata by stripe-webhook and in-place interval changes.';

create or replace function public.get_my_entitlements()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select jsonb_object_agg(
        us.product_slug,
        jsonb_build_object(
          'active', true,
          'status', us.status,
          'current_period_end', us.current_period_end,
          'cancel_at_period_end', us.cancel_at_period_end,
          'price_interval', us.price_interval
        )
      )
      from public.user_subscriptions us
      where us.user_id = auth.uid()
        and us.status in ('active', 'trialing')
    ),
    '{}'::jsonb
  );
$$;
