# Edge Monitor roadmap

Admin-only in-app ops dashboard for EdgeTilt. **v1 shipped:** DB snapshot via RPC **`admin_ops_monitor_snapshot()`**, UI at **`?tab=monitor`** (hamburger **Monitor** when **`profiles.role = admin`**).

## Access

| Who | Route | Gate |
| --- | --- | --- |
| Admin | **`/monitor`** | Desktop full-width page (`EdgeMonitorDesktopPage` in **`App.jsx`**) |
| Admin | `/?tab=monitor` | In-app mobile tab (`AppShell` → **`EdgeMonitorScreen`**) |
| Admin | Hamburger **Monitor** | Same as `?tab=monitor` |
| Moderator | — | No access (metrics are product-wide, not moderation queue) |
| Everyone else | — | Access denied panel if tab/route forced |

**Prod vs test:** Same UI; metrics reflect whichever Supabase project **`VITE_SUPABASE_URL`** points at. Badge shows project ref (first segment of host).

## v1 (current)

**Migrations:** `supabase/migrations/20260703100000_admin_ops_monitor_snapshot.sql`, **`20260703110000_admin_ops_monitor_trends.sql`** (7-day UTC chart buckets)

**Code:** `src/features/ops/` (`EdgeMonitorScreen.jsx`, `OpsMonitorCharts.jsx`, `opsMonitorTheme.js`, `opsMonitorApi.js`)

**UI:** Gradient hero + KPI strip, 7-day pulse line chart, 24h vs 7d velocity bars, doughnuts (roles, subs, status), section accent colors (lv palette), engagement bar charts. Chart.js via lazy ops chunk (same lib as Bankroll).

- Users & roles (`profiles`)
- Subscriptions (`user_subscriptions`, `stripe_webhook_events`)
- Lounge (posts, comments, likes, bookmarks, follows, Stream rows)
- Search & rate limits (`lounge_search_analytics`, `rate_limit_events`)
- Chat (rooms, messages, members)
- Guides & tools (guides, machines, bankroll, play log)
- Offers, push, Starter weekly drops, activity events

Manual **Refresh** re-runs the RPC. No auto-poll yet.

## Phase 2 — trends & charts

- [ ] Time-series RPCs (daily signups, posts, messages, subs) for 30/90-day sparklines
- [ ] Top search queries (aggregate `lounge_search_analytics.query`, admin-only)
- [ ] Freemium funnel: users at 8/9/10 bankroll or play-log cap (from existing limit tables)
- [ ] Starter drop pool exhaustion count (`starterWeeklyDropPoolExhausted` logic mirrored in SQL)

## Phase 3 — external health (links + optional Edge proxies)

Keep secrets off the client. Prefer dashboard deep links + optional server-side probes.

| Source | Metrics | Integration |
| --- | --- | --- |
| **Sentry** | Error rate, unresolved issues, release | Link + optional server proxy with auth |
| **Stripe** | MRR, churn, failed invoices, webhook failures | Dashboard link; mirror key counts already in `user_subscriptions` |
| **Cloudflare Stream** | Pending uploads, storage minutes, 404 manifest rate | Edge cron log tail or CF API via new admin Edge fn |
| **Cloudflare R2** | Object count, bandwidth (guides + lounge media) | CF dashboard / audit scripts |
| **Supabase** | Edge Function invocations, DB size, cron job last success | Dashboard + `pg_cron` job history |
| **Vercel** | Deploy SHA (already in UI), build failures | Link to project deployments |

## Phase 4 — alerts & runbooks

- [ ] Threshold config (e.g. webhook 24h = 0, rate-limit spike)
- [ ] Email or push to admin when threshold breached (reuse `send-test-push` pattern)
- [ ] Inline runbook links per section (purge cron README, stripe handoff doc, prod checklist)

## Phase 5 — real-time

- [ ] Supabase Realtime channel for `activity_events` insert rate (live counter)
- [ ] Optional “live users” approximation (presence or heartbeat table ... TBD)

## Related docs

- **`docs/access-tiers.md`** — admin vs moderator
- **`docs/test-user-roles.md`** — SQL to grant admin on test
- **`docs/production-rollout-checklist.md`** — apply migration on prod after test sign-off
- **`docs/test-buildout-backlog.md`** — Edge Monitor section + smoke steps

## Smoke (test)

1. Apply **`20260703100000_admin_ops_monitor_snapshot.sql`** on test Supabase.
2. Set your test profile to **`role = admin`**.
3. Open app → hamburger → **Monitor** (or `/?tab=monitor`).
4. Confirm sections load; **Refresh** updates **Snapshot** timestamp.
5. Non-admin account: tab shows “admin-only” (no RPC call required for gate test).
6. **Desktop:** open **`/monitor`** in a wide browser window ... 12-col chart layout, sticky header, **Open app** / **Mobile tab** links.

---

_Update log: 2026-07-03 — v1 scaffold (RPC + EdgeMonitorScreen + AppShell tab)._
