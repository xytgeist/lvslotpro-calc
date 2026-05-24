# Edge billing — Stripe Checkout + Customer Portal + webhooks

Multi-product Edge subscriptions. Product slugs: **`slots-edge`**, **`sports-edge`**, **`crypto-edge`**.

## Functions

| Function | Auth | Purpose |
| --- | --- | --- |
| **`stripe-create-checkout-session`** | User JWT | `POST { "product_slug": "slots-edge" }` → `{ url }` |
| **`stripe-create-portal-session`** | User JWT | Manage/cancel billing in Stripe Customer Portal |
| **`stripe-webhook`** | Stripe signature | Updates **`user_subscriptions`** + syncs **`profiles.has_active_subscription`** for **`slots-edge`** |

## Prerequisites

1. Apply migration **`supabase/migrations/20260526120000_edge_subscriptions.sql`** on test (then prod).
2. Stripe Dashboard → Product + recurring Price for **Slots Edge** (test mode first).
3. Enable **Customer Portal** in Stripe.
4. Webhook endpoint: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`  
   Events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.

## Supabase Edge secrets (names only)

| Secret | Example use |
| --- | --- |
| **`STRIPE_SECRET_KEY`** | `sk_test_…` |
| **`STRIPE_WEBHOOK_SECRET`** | `whsec_…` from webhook endpoint |
| **`STRIPE_PRICE_SLOTS_EDGE`** | `price_…` for slots-edge checkout |
| **`STRIPE_PRICE_SPORTS_EDGE`** | When sports-edge goes live |
| **`STRIPE_PRICE_CRYPTO_EDGE`** | When crypto-edge goes live |
| **`STRIPE_CHECKOUT_DEFAULT_ORIGIN`** | Optional fallback if `Origin` header missing (e.g. `https://lvslotpro.com`) |

Price IDs are **per Stripe account** (test vs live). Map slug → secret via **`STRIPE_PRICE_<SLUG>`** with hyphens → underscores.

## Deploy (test project)

```bash
supabase link --project-ref <test-ref> --yes
supabase functions deploy stripe-create-checkout-session
supabase functions deploy stripe-create-portal-session
supabase functions deploy stripe-webhook
```

`stripe-webhook` uses **`verify_jwt = false`** in **`supabase/config.toml`** (Stripe signs requests, not Supabase JWT).

## Client

- **`get_my_entitlements()`** RPC → `{ "slots-edge": { active, status, … } }`
- Subscribe modal calls checkout; success redirect `?billing=success&product=slots-edge`
- Legacy **`profiles.has_active_subscription`** still updated for **`slots-edge`** (hamburger locks, chat subscriber rooms)

## Manual tier testing (without Stripe)

Still works via SQL on **`user_subscriptions`** or legacy flag — see **`docs/test-user-roles.md`**.
