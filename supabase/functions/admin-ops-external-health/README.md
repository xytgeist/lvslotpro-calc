# admin-ops-external-health

Admin-only Edge Function for **Edge Monitor Phase 3** ... server-side probes + dashboard deep links. Secrets never reach the browser.

## Auth

`Authorization: Bearer <supabase-user-jwt>` ... caller must have **`profiles.role = 'admin'`**.

`supabase/config.toml` sets **`verify_jwt = true`**.

## Deploy

```bash
supabase functions deploy admin-ops-external-health --project-ref kcosfvmreeiosdjdzycb
```

Redeploy on **production** (`jtjgtucumuoswnbauxry`) after test sign-off.

## Secrets (optional probes)

| Secret | Purpose |
| --- | --- |
| **`STRIPE_SECRET_KEY`** | Active / past_due subscription sample counts |
| **`CLOUDFLARE_ACCOUNT_ID`** | Dashboard links + Stream probe |
| **`CLOUDFLARE_STREAM_API_TOKEN`** | Pending Stream upload count |
| **`SENTRY_AUTH_TOKEN`** | Unresolved issue count (Sentry API) |
| **`SENTRY_ORG_SLUG`** | Default `edge-ev` |
| **`SENTRY_PROJECT_SLUG`** | Default `edgetilt` |
| **`OPS_MONITOR_VERCEL_PROJECT_URL`** | Vercel deployments deep link override |

Without optional secrets, the function still returns **dashboard URLs**; probe fields show `configured: false`.

## Client

`src/features/ops/opsMonitorExternalHealth.js` invokes this function from the Monitor tab.
