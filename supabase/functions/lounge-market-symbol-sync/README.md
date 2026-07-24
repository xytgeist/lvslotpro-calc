# Lounge market symbol sync (manual backfill)

Optional **service-role** backfill for cashtag lookup (`market_instruments`). **No scheduled cron** (disabled **`20260723290000`**).

## Crypto backfill (~2000 coins)

CoinGecko **`/coins/markets`**: 8 pages × 250 = up to **2000** unique tickers, **`coin_id` + logo_url** included. Batch upsert (**500 rows/chunk**, ~4 PostgREST calls).

**8 CoinGecko API calls** + **~4 DB batch upserts** per run.

## Secrets

Same as `lounge-market-data`:

- **`FINNHUB_API_KEY`** (unused for crypto-only mode)
- **`COINGECKO_API_KEY`** (recommended)

Vault for SQL invoke (reuse lounge odds cron):

- `lounge_odds_poll_project_url`
- `lounge_odds_poll_service_role_key`

## Deploy

```bash
supabase functions deploy lounge-market-symbol-sync --project-ref <project-ref>
```

Apply migration **`20260723300000_invoke_lounge_market_crypto_backfill.sql`**.

## Manual run

```sql
select public.invoke_lounge_market_crypto_backfill(8);
```

Check pg_net response (no **546**):

```sql
select id, status_code, timed_out, left(content, 400) as body, created
from net._http_response
order by id desc
limit 3;
```

Verify rows:

```sql
select count(*)::int as crypto_total,
       count(*) filter (where btrim(logo_url) <> '')::int as crypto_with_logo
from market_instruments
where asset_class = 'crypto';
```

## POST body (curl / service role)

```json
{ "crypto_only": true, "max_pages": 8 }
```

Legacy full sync (avoid — may 546):

```json
{ "crypto_only": false }
```
