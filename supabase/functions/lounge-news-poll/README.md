# lounge-news-poll

Financial wire bot worker: polls allowlisted Finnhub/RSS sources, scores headlines, auto-publishes to Lounge.

## Auth

- **Cron:** `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`
- **Manual (Edge Monitor):** admin user JWT

## Setup (test)

1. Apply migration `20260703140000_lounge_bot_financial_wire.sql`.
2. Create auth user + profile for the bot persona.
3. Insert bot account and seed sources (see `docs/lounge-bot-market-news.md`).
4. Set `enabled = true` when ready.
5. Ensure `FINNHUB_API_KEY` is on Edge secrets.
6. Schedule cron every 3 minutes or invoke manually with service role bearer.

## Body

```json
{ "slug": "financial-wire", "dryRun": false, "force": true }
```
