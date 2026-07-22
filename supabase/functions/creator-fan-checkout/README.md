# Creator fan subscriptions (Connect + Checkout)

**Spec:** `docs/entitlements-matrix.md` §5.

## Edge functions

| Function | Auth | Body |
| --- | --- | --- |
| **`creator-fan-connect`** | User JWT | `{ "action": "onboard" \| "refresh" }` → onboarding `{ url }` or refresh `{ connect_onboarding_complete }` |
| **`creator-fan-checkout`** | User JWT | `{ "creator_user_id": "uuid" }` → `{ url }` Connect destination subscription checkout |
| **`creator-fan-resume-subscription`** | User JWT | `{ "creator_user_id": "uuid" }` → `{ ok: true }` clears **`cancel_at_period_end`** (fan subscribe modal **Resume subscription**) |
| **`creator-fan-reconcile-stripe`** | Service role or **`CREATOR_FAN_RECONCILE_CRON_SECRET`** | POST (optional **`dryRun`**) → scans Stripe fan subs, upserts **`creator_subscriptions`** |
| **`stripe-create-portal-session`** | User JWT | optional `{ "creator_user_id": "uuid" }` → cancel-at-period-end portal flow |

**Webhook:** `stripe-webhook` writes `creator_subscriptions` when subscription metadata includes `billing_kind: creator_fan_sub` (set by checkout). On processing failure (400 to Stripe), ops email via **`sendBillingWebhookFailureAdminAlert`** when **`BILLING_ADMIN_ALERT_EMAILS`** + **`RESEND_API_KEY`** set. Checkout return: **`/?billing=fan_success&creator={uuid}`** … **`App.jsx`** polls **`get_my_creator_fan_entitlements`** then fires **`edge:creator-fan-billing-return`**. Backfill if webhook missed a row: **`npm run creator-fan:sync-from-stripe -- --target=production --customer=cus_…`** (requires **`STRIPE_SECRET_KEY`**). **Daily reconcile:** Edge **`creator-fan-reconcile-stripe`** + pg_cron **`creator_fan_reconcile_stripe_daily`** (migration **`20260722210000`**) … lists Stripe fan subs and upserts Postgres; emails ops only when reconcile errors.

## Stripe (test mode first)

Create **seven monthly Prices** on the **platform** account (USD), one per tier. Map to Edge secrets:

| Tier key | MSRP | Edge secret |
| --- | --- | --- |
| `fan-tier-499` | $4.99/mo | `STRIPE_PRICE_FAN_TIER_499` |
| `fan-tier-999` | $9.99/mo | `STRIPE_PRICE_FAN_TIER_999` |
| `fan-tier-1999` | $19.99/mo | `STRIPE_PRICE_FAN_TIER_1999` |
| `fan-tier-4999` | $49.99/mo | `STRIPE_PRICE_FAN_TIER_4999` |
| `fan-tier-9999` | $99.99/mo | `STRIPE_PRICE_FAN_TIER_9999` |
| `fan-tier-14999` | $149.99/mo | `STRIPE_PRICE_FAN_TIER_14999` |
| `fan-tier-24999` | $249.99/mo | `STRIPE_PRICE_FAN_TIER_24999` |

Prices must be compatible with **Connect destination charges** (see Stripe Connect subs docs).

Also requires existing **`STRIPE_SECRET_KEY`** and **`STRIPE_WEBHOOK_SECRET`**.

## Database

Apply migration **`20260720180000_creator_fan_subs_foundation.sql`** on test before smoke.

## Client

Settings → **Fan subscriptions** (`CreatorFanMonetizationPanel`). Subscriber checkout API: `startCreatorFanCheckout` in `src/features/creatorFanSubs/creatorFanSubsApi.js` (profile **Support @handle** UI still TBD).
