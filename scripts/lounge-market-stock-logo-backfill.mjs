#!/usr/bin/env node
/**
 * Mirror cashtag logos to R2 on `market_instruments` (stocks + crypto).
 *
 *   node scripts/lounge-market-stock-logo-backfill.mjs --target=production
 *   node scripts/lounge-market-stock-logo-backfill.mjs --target=production --crypto-only
 *   node scripts/lounge-market-stock-logo-backfill.mjs --target=production --stocks-only
 *
 * Free Finnhub tier: ~50 profile calls/batch max; 70s pause between batches.
 */
import { loadSupabaseEnv, readSupabaseCredentials } from './lib/supabaseEnv.mjs'

const BATCH = 50
const PAUSE_MS = 70_000
const RATE_LIMIT_PAUSE_MS = 120_000
const MAX_BATCHES = 250

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function runBatch(mode, afterCacheKey) {
  const { url, key } = readSupabaseCredentials()
  const body =
    mode === 'crypto'
      ? { crypto_logo_batch: true, limit: BATCH }
      : { stock_logo_batch: true, limit: BATCH }
  if (afterCacheKey) body.after_cache_key = afterCacheKey

  const res = await fetch(`${url}/functions/v1/lounge-market-symbol-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      apikey: key,
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Non-JSON response (${res.status}): ${text.slice(0, 200)}`)
  }

  if (!res.ok) {
    const err = new Error(json.error || `HTTP ${res.status}`)
    err.status = res.status
    throw err
  }
  return json
}

async function runUntilDone(mode) {
  let cursor = null
  for (let n = 1; n <= MAX_BATCHES; n += 1) {
    console.log(`\n[${mode} batch ${n}] after_cache_key=${cursor || '(start)'}`)

    let result
    try {
      result = await runBatch(mode, cursor)
    } catch (e) {
      if (e.status === 429 || String(e.message || '').includes('429')) {
        console.warn(`[${mode}] rate limit — sleeping 120s`)
        await sleep(RATE_LIMIT_PAUSE_MS)
        n -= 1
        continue
      }
      throw e
    }

    console.log(JSON.stringify(result))

    if (!result.candidates || result.candidates <= 0) {
      console.log(`[${mode}] done — no more candidates.`)
      break
    }

    cursor = result.next_after_cache_key || result.last_cache_key
    if (!cursor) break

    const remaining = result.remaining_without_r2_logo ?? result.remaining_without_logo ?? 0
    if (remaining <= 0) {
      console.log(`[${mode}] done — remaining 0.`)
      break
    }

    console.log(`[${mode}] sleeping ${PAUSE_MS / 1000}s…`)
    await sleep(PAUSE_MS)
  }
}

async function main() {
  const target = process.argv.includes('--target=production') ? 'production' : 'test'
  if (target !== 'production') {
    console.error('Pass --target=production')
    process.exit(1)
  }

  const stocksOnly = process.argv.includes('--stocks-only')
  const cryptoOnly = process.argv.includes('--crypto-only')

  loadSupabaseEnv('production')
  const { url } = readSupabaseCredentials()
  console.log(`[logo-r2-backfill] target=production url=${url}`)

  if (!cryptoOnly) await runUntilDone('stock')
  if (!stocksOnly) await runUntilDone('crypto')
}

main().catch((e) => {
  console.error('[logo-r2-backfill] fatal:', e.message || e)
  process.exit(1)
})
