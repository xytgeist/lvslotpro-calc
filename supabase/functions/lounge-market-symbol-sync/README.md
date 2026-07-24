# Lounge market symbol sync (manual backfill)

Optional **service-role** backfill for cashtag lookup (`market_instruments`). **No scheduled cron** (disabled **`20260723290000`**).

Logos are **mirrored to Cloudflare R2** (`market-logos/stocks/…`, `market-logos/crypto/…`); **`logo_url`** in DB is our public R2 URL.

Requires **`LOUNGE_CF_R2_*`** + **`CLOUDFLARE_ACCOUNT_ID`** on **`lounge-market-symbol-sync`** (same as Lounge media).

## Crypto metadata backfill (~2000 coins)

CoinGecko **`/coins/markets`** + **R2 logo mirror** in one run:

```json
{ "crypto_only": true, "max_pages": 8 }
```

## Logo batch → R2 (50 per run, repeat with cursor)

Stocks: Finnhub **`/stock/profile2`** (or existing source URL) → download → R2 → upsert.

Crypto: existing **`logo_url`** (CoinGecko) or live fetch → R2 → upsert.

Free Finnhub: **60 calls/min** — one batch per **~70s**.

```json
{ "stock_logo_batch": true, "limit": 50, "after_cache_key": "stock:xyz" }
{ "crypto_logo_batch": true, "limit": 50, "after_cache_key": "crypto:btc" }
```

```bash
node scripts/lounge-market-stock-logo-backfill.mjs --target=production
node scripts/lounge-market-stock-logo-backfill.mjs --target=production --crypto-only
```

Response: **`r2_hits`**, **`finnhub_fetches`**, **`upserted`**, **`remaining_without_r2_logo`**, **`next_after_cache_key`**.

## Secrets

- **`FINNHUB_API_KEY`** (stock logos)
- **`COINGECKO_API_KEY`** (crypto fetch fallback)
- **`LOUNGE_CF_R2_*`**, **`CLOUDFLARE_ACCOUNT_ID`**

## Deploy

```bash
supabase functions deploy lounge-market-symbol-sync --project-ref <project-ref>
supabase functions deploy lounge-market-data --project-ref <project-ref>
```

Redeploy **`lounge-market-data`** after R2 allowlist changes (Advanced snapshot **`logo_image`**).
