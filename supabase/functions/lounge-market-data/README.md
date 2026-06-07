# Lounge market chart data (Finnhub proxy)

Server-side market search, embed build, and rolling batch quotes for Lounge feed chart cards.

## Secrets (Supabase Edge)

- **`FINNHUB_API_KEY`** — [Finnhub](https://finnhub.io/) API token (quotes + search; **US stock candles often blocked on free tier**). Non-USD listings are converted to **USD** via Finnhub **`/forex/rates`** (with **Yahoo FX** fallback when Finnhub forex is forbidden).
- Stock sparklines, quotes, profiles, and **modal news** fall back to **Yahoo Finance** (no key) when Finnhub returns empty or **403**.
- **Modal / Advanced candles:** Yahoo and Finnhub candle responses parse full **OHLCV** (`o`, `h`, `l`, `c`, `v` on each bar). CoinGecko crypto fallback uses **`/coins/{id}/ohlc`** (full OHLC when available; **`market_chart`** close-only if OHLC fails). Quote-synthesized fallbacks remain close-only.
- **`COINGECKO_API_KEY`** — [CoinGecko Demo API](https://docs.coingecko.com/reference/setting-up-your-api-key) key for crypto logos, **USD market cap**, and search. Works without a key at low volume; set a demo key on test/prod to avoid rate limits.
- Optional **`LOUNGE_MARKET_DEBUG_COINGECKO=1`** — log per-request CoinGecko usage to Edge logs (`[coingeckoUsage]` JSON) and include `_debug.coingecko` in responses when `debug_coingecko: true` is sent. Client: enable **Settings → Admin utils → Console log HUD** to auto-send the flag and print summaries in the browser console.
- Optional **`LOUNGE_PUBLIC_ORIGIN`** — e.g. `https://lvslotpro.com` for OG image URLs on embed attach.

### CoinGecko usage debug (dev)

Each `lounge-market-data` response (when debug is on) includes:

```json
"_debug": {
  "coingecko": {
    "action": "batch_rolling",
    "network_calls": 4,
    "cache_hits": 1,
    "by_reason": { "crypto_profile_search": 2, "crypto_profile_mcap": 2, "candles_ohlc": 1 },
    "by_endpoint": { "/search": 2, "/simple/price": 2, "/coins/bitcoin/ohlc": 1 },
    "calls": [ … ]
  }
}
```

**Reason tags:** `market_search`, `crypto_profile_search`, `crypto_profile_mcap`, `crypto_profile` (memory cache hit), `picker_batch_price`, `candles_ohlc`, `candles_ohlc_retry`, `candles_market_chart`, `candles_advanced_ohlc`, `candles_advanced_ohlc_retry`.

**Typical smoke:** post `$BTC`, scroll feed (wait for `batch_rolling`), open Advanced, pan left once — compare `by_reason` totals per action in Supabase **Edge Functions → lounge-market-data → Logs** or the Console log HUD.

## Deploy (test)

```bash
supabase functions deploy lounge-market-data --project-ref jtjgtucumuoswnbauxry
```

## Actions (POST + user JWT)

| action | body | response |
| --- | --- | --- |
| `search` | `{ query }` | `{ results[] }` — Finnhub stocks + CoinGecko crypto; **picker enrichment** via Yahoo (price/mcap/exchange) + CoinGecko batch (crypto), 45s Edge cache |
| `preview` | `{ symbol, asset_class }` | `{ preview }` picker info row |
| `attach` | `{ post_id, caption, symbols[]? }` | `{ embeds[], warnings?[] }` — merges caption `$` cashtags (auto) with picker rows; picker wins per ticker; **skips failed tickers** instead of failing the whole post |
| `batch_rolling` | `{ symbols[] }` | `{ quotes }` keyed by cache key |
| `modal_series` | `{ symbol, asset_class, kind?, window_key? }` or extend `{ …, before_sec }` or Advanced `{ …, resolution, bar_limit?, before_sec? }` | `{ quote, bars, window_label, has_more? }` or extend `{ bars, has_more }` — **`resolution`** (`1`, `5`, `15`, `60`, `120`, `240`, `D`, `W`) + **`bar_limit`** for Advanced bar-count windows; **`before_sec`** loads **`chunkBars`** (200) older bars capped by per-resolution max lookback |
| `modal_news` | `{ symbol, asset_class }` | `{ news }` — Finnhub company-news (30d) or crypto feed; **Yahoo search news** when Finnhub empty/forbidden |
| `logo_image` | `{ url? }` or `{ symbol, asset_class }` | `{ data_base64, content_type }` — server-side logo fetch for **Advanced snapshot PNG** (canvas-safe; allowlisted hosts) |

Client: `src/utils/loungeMarketApi.js`.

Apply migration **`20260609120000_lounge_market_embeds.sql`** before use.
