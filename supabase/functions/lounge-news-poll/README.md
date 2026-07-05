# lounge-news-poll

Market Edge financial news worker: polls allowlisted Finnhub, SEC EDGAR, and RSS sources; scores headlines; auto-publishes to Lounge.

## Auth

- **Cron:** `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`
- **Manual (Edge Monitor / Bot Portal):** admin user JWT

## Edge secrets

| Secret | Required | Purpose |
| --- | --- | --- |
| `FINNHUB_API_KEY` | Yes | Finnhub news categories |
| `SEC_EDGAR_USER_AGENT` | Recommended | SEC fair-access policy (defaults to `EdgeTilt MarketEdge/1.0 (support@edgetilt.com)`) |

## Setup (test, then prod schema)

1. Apply migrations `20260703140000` through `20260705040000`.
2. Create bot via **Bot Portal** wizard or `supabase/seed/lounge_market_edge_bot.sql`.
3. `select public.lounge_bot_seed_market_news_sources('<BOT_USER_UUID>'::uuid);` to insert all default sources.
4. Deploy `lounge-news-poll` + `lounge-bot-admin`.
5. Vault: `lounge_odds_poll_project_url` + `lounge_odds_poll_service_role_key` (cron).
6. Dry-run poll from portal → flip **Running** on **test** only until smoke passes.

## Default sources

Finnhub (general, M&A, forex, crypto), SEC EDGAR (8-K, 10-Q, 10-K), SEC/Fed/Treasury/CFTC/EIA RSS, BBC Business + NPR Business RSS. See `docs/lounge-bot-market-news.md` § Default allowlist.

## Body

```json
{ "slug": "market-edge", "dryRun": false, "force": true }
```

## Cron

`lounge_news_poll_market_edge` every 3 minutes via `invoke_lounge_news_poll()` (running `market_news` bots only).
