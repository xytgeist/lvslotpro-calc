/**
 * Service-role manual backfill for cashtag symbol lookup (`market_instruments`).
 *
 * POST body (pick one mode):
 *   { "stock_logo_batch": true, "limit": 50, "after_cache_key": "stock:aapl" }
 *   { "crypto_logo_batch": true, "limit": 50, "after_cache_key": "crypto:btc" }
 *   { "crypto_only": true, "max_pages": 8 }
 *   { "crypto_only": false }  — legacy full sync if stale (avoid)
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { isKnownServiceRoleBearer } from '../_shared/adminAuth.ts'
import {
  syncMarketCryptoLookup,
  syncMarketCryptoLogosBatch,
  syncMarketStockLogosBatch,
  syncMarketSymbolLookupIfStale,
} from '../_shared/marketSymbolLookup.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isAuthorized(req: Request, serviceRoleKey: string, supabaseUrl: string): boolean {
  const bearer = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
  return isKnownServiceRoleBearer(bearer, serviceRoleKey, supabaseUrl)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  if (!supabaseUrl || !serviceRoleKey) {
    return json(503, { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.' })
  }
  if (!isAuthorized(req, serviceRoleKey, supabaseUrl)) {
    return json(401, { error: 'Unauthorized' })
  }

  let body: Record<string, unknown> = {}
  try {
    const parsed = await req.json()
    if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>
  } catch {
    /* empty body ok */
  }

  const admin = createClient(supabaseUrl, serviceRoleKey)

  try {
    if (body.stock_logo_batch === true) {
      const limit = Math.min(200, Math.max(1, Math.floor(Number(body.limit) || 50)))
      const after = String(body.after_cache_key || '').trim()
      const result = await syncMarketStockLogosBatch(admin, {
        limit,
        ...(after ? { after_cache_key: after } : {}),
      })
      return json(200, { ok: true, mode: 'stock_logo_batch', ...result })
    }

    if (body.crypto_logo_batch === true) {
      const limit = Math.min(200, Math.max(1, Math.floor(Number(body.limit) || 50)))
      const after = String(body.after_cache_key || '').trim()
      const result = await syncMarketCryptoLogosBatch(admin, {
        limit,
        ...(after ? { after_cache_key: after } : {}),
      })
      return json(200, { ok: true, mode: 'crypto_logo_batch', ...result })
    }

    if (body.crypto_only === true) {
      const maxPages = Math.min(8, Math.max(1, Math.floor(Number(body.max_pages) || 8)))
      const result = await syncMarketCryptoLookup(admin, { maxPages })
      return json(200, { ok: true, mode: 'crypto_backfill', ...result })
    }

    if (body.crypto_only === false) {
      const synced = await syncMarketSymbolLookupIfStale(admin)
      const { data: meta } = await admin
        .from('market_symbol_lookup_meta')
        .select('last_sync_at, row_count')
        .eq('id', 1)
        .maybeSingle()

      return json(200, {
        ok: true,
        mode: 'full_sync_if_stale',
        synced,
        row_count: Number(meta?.row_count) || 0,
        last_sync_at: meta?.last_sync_at || null,
      })
    }

    return json(400, {
      error: 'Specify stock_logo_batch, crypto_logo_batch, crypto_only: true, or crypto_only: false (legacy).',
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('lounge-market-symbol-sync', msg)
    return json(500, { error: msg || 'Symbol sync failed.' })
  }
})
