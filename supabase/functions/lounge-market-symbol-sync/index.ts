/**
 * Service-role manual backfill for cashtag symbol lookup (`market_instruments`).
 *
 * POST body (optional):
 *   { "crypto_only": true, "max_pages": 8 }  — top ~2000 crypto via CoinGecko markets + batch upsert
 *
 * Manual smoke (after deploy):
 *   select public.invoke_lounge_market_crypto_backfill(8);
 */
import { createClient } from 'npm:@supabase/supabase-js@2'
import { isKnownServiceRoleBearer } from '../_shared/adminAuth.ts'
import { syncMarketCryptoLookup, syncMarketSymbolLookupIfStale } from '../_shared/marketSymbolLookup.ts'

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

  const cryptoOnly = body.crypto_only !== false
  const maxPages = Math.min(8, Math.max(1, Math.floor(Number(body.max_pages) || 8)))

  const admin = createClient(supabaseUrl, serviceRoleKey)

  try {
    if (cryptoOnly) {
      const result = await syncMarketCryptoLookup(admin, { maxPages })
      return json(200, { ok: true, mode: 'crypto_backfill', ...result })
    }

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
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('lounge-market-symbol-sync', msg)
    return json(500, { error: msg || 'Symbol sync failed.' })
  }
})
