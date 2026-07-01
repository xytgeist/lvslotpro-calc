-- Multi-product Edge subscriptions (Stripe → user_subscriptions → entitlements).
-- Product slugs: slots-edge, sports-edge, crypto-edge (display names in subscription_products).
-- Legacy profiles.has_active_subscription mirrors active slots-edge for existing client gates.

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table if not exists public.subscription_products (
  slug text primary key,
  display_name text not null,
  description text,
  active boolean not null default false,
  sort_order int not null default 0,
  stripe_product_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscription_products is
  'Sellable Edge verticals. Stripe Price IDs live in Edge secrets (STRIPE_PRICE_<SLUG>).';

insert into public.subscription_products (slug, display_name, description, active, sort_order)
values
  (
    'slots-edge',
    'Slots Edge',
    'AP calculators, guides, bankroll, and calendar OCR.',
    true,
    10
  ),
  (
    'sports-edge',
    'Sports Edge',
    'Sports betting intel (coming soon).',
    false,
    20
  ),
  (
    'crypto-edge',
    'Crypto Edge',
    'Crypto insider intel (coming soon).',
    false,
    30
  )
on conflict (slug) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Stripe customer on profile (one customer, many subscriptions)
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists stripe_customer_id text;

comment on column public.profiles.stripe_customer_id is
  'Stripe Customer id (cus_…). Set by billing Edge functions / webhook.';

create unique index if not exists profiles_stripe_customer_id_uidx
  on public.profiles (stripe_customer_id)
  where stripe_customer_id is not null;

-- ---------------------------------------------------------------------------
-- Per-user subscription rows (one row per Stripe subscription id)
-- ---------------------------------------------------------------------------
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_slug text not null references public.subscription_products (slug),
  stripe_subscription_id text not null,
  stripe_customer_id text not null,
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_subscriptions_stripe_subscription_id_key unique (stripe_subscription_id),
  constraint user_subscriptions_user_product_key unique (user_id, product_slug)
);

create index if not exists user_subscriptions_user_id_idx
  on public.user_subscriptions (user_id);

comment on table public.user_subscriptions is
  'Active/historical Stripe subscriptions per Edge product. Updated by stripe-webhook Edge function.';

-- ---------------------------------------------------------------------------
-- Webhook idempotency
-- ---------------------------------------------------------------------------
create table if not exists public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  received_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Sync legacy boolean from slots-edge (existing hamburger locks + lounge-chat)
-- ---------------------------------------------------------------------------
create or replace function public.sync_profile_has_active_subscription(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  active_slots boolean;
begin
  if p_user_id is null then
    return;
  end if;

  select exists (
    select 1
    from public.user_subscriptions us
    where us.user_id = p_user_id
      and us.product_slug = 'slots-edge'
      and us.status in ('active', 'trialing')
  )
  into active_slots;

  update public.profiles p
  set has_active_subscription = active_slots
  where p.user_id = p_user_id
    and p.has_active_subscription is distinct from active_slots;
end;
$$;

comment on function public.sync_profile_has_active_subscription(uuid) is
  'Keeps profiles.has_active_subscription in sync with active slots-edge (legacy UI gate).';

-- ---------------------------------------------------------------------------
-- Entitlement helpers
-- ---------------------------------------------------------------------------
create or replace function public.user_has_entitlement(p_user_id uuid, p_product_slug text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_subscriptions us
    where us.user_id = p_user_id
      and us.product_slug = p_product_slug
      and us.status in ('active', 'trialing')
  );
$$;

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
          'cancel_at_period_end', us.cancel_at_period_end
        )
      )
      from public.user_subscriptions us
      where us.user_id = auth.uid()
        and us.status in ('active', 'trialing')
    ),
    '{}'::jsonb
  );
$$;

grant execute on function public.get_my_entitlements() to authenticated;
grant execute on function public.user_has_entitlement(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.subscription_products enable row level security;
alter table public.user_subscriptions enable row level security;

drop policy if exists "subscription_products_public_read" on public.subscription_products;
create policy "subscription_products_public_read"
  on public.subscription_products
  for select
  using (true);

drop policy if exists "user_subscriptions_select_own" on public.user_subscriptions;
create policy "user_subscriptions_select_own"
  on public.user_subscriptions
  for select
  using (auth.uid() = user_id);

comment on column public.profiles.has_active_subscription is
  'Legacy UI gate: mirrors active slots-edge subscription. Prefer get_my_entitlements() for new code.';
