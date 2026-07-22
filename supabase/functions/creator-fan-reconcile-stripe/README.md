# creator-fan-reconcile-stripe

Daily safety net: list Stripe subscriptions (`active`, `trialing`, `past_due`) with fan metadata and upsert **`creator_subscriptions`** via shared **`billingDb`** logic (same as webhook).

## Auth

POST with either:

- **Service role** bearer (legacy JWT or `SUPABASE_SERVICE_ROLE_KEY`), or
- **`CREATOR_FAN_RECONCILE_CRON_SECRET`** as `Authorization: Bearer …` or header **`x-creator-fan-reconcile-secret`**

## Body (optional)

```json
{ "dryRun": true }
```

Or query `?dryRun=1`.

## Schedule

Migration **`20260722210000_creator_fan_reconcile_cron.sql`** — pg_cron daily. Requires Vault secrets (see migration header) on each Supabase project.

## Deploy

```bash
supabase functions deploy creator-fan-reconcile-stripe --project-ref YOUR_PROJECT_REF
```

Set Edge secret **`CREATOR_FAN_RECONCILE_CRON_SECRET`** (optional if cron uses service_role JWT from Vault).

## Manual

```bash
curl -X POST "$SUPABASE_URL/functions/v1/creator-fan-reconcile-stripe" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Email on reconcile **errors** only when **`BILLING_ADMIN_ALERT_EMAILS`** + **`RESEND_API_KEY`** are set (same as checkout alerts).
