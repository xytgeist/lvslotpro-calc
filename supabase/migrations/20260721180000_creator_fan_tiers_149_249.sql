-- Add $149.99 and $249.99 creator fan sub preset tiers (Ryan 2026-07-21).
-- Stripe Price ids: Edge secrets STRIPE_PRICE_FAN_TIER_14999, STRIPE_PRICE_FAN_TIER_24999.

insert into public.creator_fan_tiers (tier_key, msrp_cents, sort_order)
values
  ('fan-tier-14999', 14999, 60),
  ('fan-tier-24999', 24999, 70)
on conflict (tier_key) do update set
  msrp_cents = excluded.msrp_cents,
  sort_order = excluded.sort_order,
  active = excluded.active;
