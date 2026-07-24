import { loungeMarketSymbolUniverse } from '../../utils/loungeMarketApi.js'
import { getLoungeCashtagSymbolSeedRows } from './loungeCashtagSymbolSeed.js'

const STORAGE_KEY = 'lounge-market-symbol-universe-v3'
const TTL_MS = 24 * 60 * 60 * 1000

const SEED_ROWS = getLoungeCashtagSymbolSeedRows()

/** @type {{ updated_at: string, rows: object[], full?: boolean } | null} */
let memoryCache = null
/** @type {Promise<{ updated_at: string, rows: object[], full?: boolean }> | null} */
let inflight = null

function isStale(updatedAt) {
  const ts = Date.parse(String(updatedAt || ''))
  if (!Number.isFinite(ts)) return true
  return Date.now() - ts > TTL_MS
}

function seedPayload() {
  return { updated_at: new Date().toISOString(), rows: SEED_ROWS, full: false }
}

function readStorageCache() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const rows = Array.isArray(parsed?.rows) ? parsed.rows : null
    const updated_at = String(parsed?.updated_at || '').trim()
    if (!rows?.length || !updated_at || isStale(updated_at)) return null
    return { updated_at, rows, full: Boolean(parsed?.full) }
  } catch {
    return null
  }
}

function writeStorageCache(payload) {
  if (typeof window === 'undefined' || !payload?.rows?.length) return
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        updated_at: payload.updated_at,
        rows: payload.rows,
        full: Boolean(payload.full),
      }),
    )
  } catch {
    // quota / private mode — memory cache still works this session
  }
}

async function fetchUniverse(supabaseClient) {
  try {
    const data = await loungeMarketSymbolUniverse(supabaseClient)
    if (Array.isArray(data?.rows) && data.rows.length > SEED_ROWS.length) {
      const payload = {
        updated_at: String(data.updated_at || new Date().toISOString()),
        rows: data.rows,
        full: true,
      }
      memoryCache = payload
      writeStorageCache(payload)
      return payload
    }
  } catch (err) {
    console.warn('[lounge] market symbol universe fetch:', err)
  }

  const fallback = seedPayload()
  memoryCache = fallback
  return fallback
}

/** Instant bundled rows (crypto + popular US tickers) — no network. */
export function getLoungeCashtagSymbolSeedUniverse() {
  return seedPayload()
}

/**
 * Load US + top-crypto symbol list once per day (localStorage + in-memory).
 * Falls back to bundled seed when Edge `symbol_universe` is unavailable.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {{ force?: boolean }} [opts]
 */
export async function ensureLoungeMarketSymbolUniverse(supabaseClient, opts = {}) {
  if (!opts.force && memoryCache && !isStale(memoryCache.updated_at)) {
    return memoryCache
  }

  if (!opts.force) {
    const stored = readStorageCache()
    if (stored) {
      memoryCache = stored
      return stored
    }
  }

  if (inflight) return inflight

  inflight = fetchUniverse(supabaseClient).finally(() => {
    inflight = null
  })
  return inflight
}

/** Fire-and-forget warm load when composer mounts. */
export function prefetchLoungeMarketSymbolUniverse(supabaseClient) {
  void ensureLoungeMarketSymbolUniverse(supabaseClient).catch((err) => {
    console.warn('[lounge] market symbol universe prefetch:', err)
  })
}

/** Merge resolved rows into in-memory + localStorage universe (miss fallback). */
export function mergeLoungeMarketSymbolUniverseRows(newRows) {
  const incoming = Array.isArray(newRows) ? newRows : []
  if (!incoming.length) return memoryCache || seedPayload()

  const base = memoryCache?.rows?.length ? memoryCache.rows : readStorageCache()?.rows || SEED_ROWS
  const byKey = new Map()
  for (const row of base) {
    const key = `${row?.asset_class || ''}:${row?.symbol || ''}`.toLowerCase()
    if (key !== ':') byKey.set(key, row)
  }
  for (const row of incoming) {
    const key = `${row?.asset_class || ''}:${row?.symbol || ''}`.toLowerCase()
    if (key !== ':') byKey.set(key, row)
  }
  const rows = [...byKey.values()]
  const payload = {
    updated_at: memoryCache?.updated_at || new Date().toISOString(),
    rows,
    full: rows.length > SEED_ROWS.length,
  }
  memoryCache = payload
  writeStorageCache(payload)
  return payload
}
