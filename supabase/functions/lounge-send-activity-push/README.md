# lounge-send-activity-push

Supabase Edge Function invoked from Postgres (`pg_net`) when a row is inserted into **`activity_events`**. Sends a web push to all **`push_subscriptions`** for the **recipient** user.

## Required secrets

Set in Supabase Dashboard → Edge Functions → Secrets (same VAPID keys as Offers push):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WEB_PUSH_PUBLIC_KEY`
- `WEB_PUSH_PRIVATE_KEY`
- `WEB_PUSH_SUBJECT` (e.g. `mailto:support@lvslotpro.com`)
- **`LOUNGE_ACTIVITY_PUSH_SECRET`** — shared with Vault **`lounge_activity_push_http_secret`** (see migration)

## Deploy

```bash
supabase functions deploy lounge-send-activity-push
```

`supabase/config.toml` sets **`verify_jwt = false`**; auth is the **`x-lounge-activity-push-secret`** header from the DB trigger.

## Database (test)

Apply migrations in order:

- **`20260523160000_lounge_activity_events_push.sql`** — immediate push trigger
- **`20260523170000_lounge_activity_push_h3.sql`** — batched like/bookmark (10s debounce), `notification_preferences`, cron flush

Then create Vault secrets (SQL Editor, once per project):

```sql
select vault.create_secret('YOUR_PUSH_SECRET', 'lounge_activity_push_http_secret');
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'lounge_activity_push_project_url');
select vault.create_secret('YOUR_LEGACY_ANON_JWT', 'lounge_activity_push_supabase_anon_key');
```

- **`YOUR_PUSH_SECRET`** must match Edge **`LOUNGE_ACTIVITY_PUSH_SECRET`**.
- **`lounge_activity_push_project_url`** — project base URL (no trailing slash).
- **`lounge_activity_push_supabase_anon_key`** — legacy JWT **anon** `public` key (`eyJ…`), not `sb_publishable_…`.

## Client

Lounge **Settings → Notifications**:

- **Push notifications** — device master toggle (`push_subscriptions` + localStorage)
- **Notify me about** — per-category prefs in `notification_preferences` (account-wide)

Like/bookmark pushes are **debounced 10 seconds** and **grouped** (`@a and 4 others liked your post`). Replies, mentions, follows, and reposts stay **immediate**.

Tap targets:

- **Follow** → `/?tab=home&u=<handle>`
- **Post activity** → `/?tab=home&post=<uuid>`
- Fallback → `/?tab=home&lounge=notifications`

## Smoke

1. Apply SQL + deploy function + set secrets.
2. Signed in on test: Settings → enable push (allow browser permission).
3. From another account, like/comment/follow the test user.
4. Confirm OS notification; tap opens Lounge post/profile/notifications.

Optional: invoke manually (replace ids/secrets):

```bash
curl -X POST "$SUPABASE_URL/functions/v1/lounge-send-activity-push" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "x-lounge-activity-push-secret: $PUSH_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"activityEventId":"UUID"}'
```

Verify **`net._http_response`** if the trigger fires but no push arrives.
