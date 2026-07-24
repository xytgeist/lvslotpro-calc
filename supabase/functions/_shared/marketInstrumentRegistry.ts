import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { ensureMarketInstrumentLogoOnR2 } from './marketLogoR2.ts'
import type { MarketAssetClass, MarketEmbed } from './finnhubMarket.ts'
import { finnhubSymbolForAsset } from './finnhubMarket.ts'

export type MarketInstrumentRow = {
  cache_key: string
  display_symbol: string
  asset_class: MarketAssetClass
  symbol: string
  coin_id: string | null
  name: string
  exchange: string
  logo_url: string
  market_cap_usd: number | null
  listing_currency: string
  metadata_updated_at: string
}

export function marketInstrumentCacheKey(symbol: string, assetClass: MarketAssetClass): string {
  return `${assetClass}:${finnhubSymbolForAsset(symbol, assetClass)}`.toLowerCase()
}

export function marketInstrumentFromEmbed(embed: MarketEmbed): MarketInstrumentRow {
  const symbol = String(embed.symbol || '').trim()
  const assetClass = embed.asset_class
  return {
    cache_key: marketInstrumentCacheKey(symbol, assetClass),
    display_symbol: String(embed.display_symbol || '').trim().toUpperCase(),
    asset_class: assetClass,
    symbol,
    coin_id: embed.coin_id ? String(embed.coin_id).trim() : null,
    name: String(embed.name || '').trim(),
    exchange: String(embed.exchange || '').trim(),
    logo_url: String(embed.logo_url || '').trim(),
    market_cap_usd:
      embed.market_cap != null && Number.isFinite(Number(embed.market_cap)) ? Number(embed.market_cap) : null,
    listing_currency: String(embed.currency || 'USD').trim() || 'USD',
    metadata_updated_at: String(embed.metadata_as_of || new Date().toISOString()),
  }
}

export async function readMarketInstrument(
  admin: SupabaseClient,
  cacheKey: string,
): Promise<MarketInstrumentRow | null> {
  const key = String(cacheKey || '').trim().toLowerCase()
  if (!key) return null
  const { data } = await admin.from('market_instruments').select('*').eq('cache_key', key).maybeSingle()
  if (!data?.cache_key) return null
  return data as MarketInstrumentRow
}

export async function readMarketInstrumentCoinId(
  admin: SupabaseClient,
  symbol: string,
  assetClass: MarketAssetClass,
): Promise<string | null> {
  const row = await readMarketInstrument(admin, marketInstrumentCacheKey(symbol, assetClass))
  const coinId = String(row?.coin_id || '').trim()
  return coinId || null
}

/** Batch-read stored logos from `market_instruments` (R2 URLs after backfill). */
export async function readMarketInstrumentLogosByCacheKeys(
  admin: SupabaseClient,
  cacheKeys: string[],
): Promise<Map<string, string>> {
  const keys = [...new Set(cacheKeys.map((k) => String(k || '').trim().toLowerCase()).filter(Boolean))]
  const out = new Map<string, string>()
  if (!keys.length) return out

  const { data, error } = await admin.from('market_instruments').select('cache_key, logo_url').in('cache_key', keys)
  if (error || !Array.isArray(data)) return out

  for (const row of data) {
    const key = String(row?.cache_key || '').trim().toLowerCase()
    const logo = String(row?.logo_url || '').trim()
    if (key && logo) out.set(key, logo)
  }
  return out
}

/** Prefer registry `logo_url` (usually R2) over empty client seed rows before picker enrich. */
export async function hydratePickerRowsWithRegistryLogos<
  T extends { symbol: string; asset_class: MarketAssetClass; logo_url?: string },
>(admin: SupabaseClient, rows: T[]): Promise<T[]> {
  if (!rows.length) return rows

  const keys = rows.map((row) => marketInstrumentCacheKey(row.symbol, row.asset_class))
  const logos = await readMarketInstrumentLogosByCacheKeys(admin, keys)

  return rows.map((row, i) => {
    const dbLogo = logos.get(keys[i]!)
    const existing = String(row.logo_url || '').trim()
    if (!dbLogo) return row
    if (existing && existing === dbLogo) return row
    return { ...row, logo_url: dbLogo }
  })
}

export async function upsertMarketInstrument(
  admin: SupabaseClient,
  row: MarketInstrumentRow,
): Promise<void> {
  const cache_key = String(row.cache_key || '').trim().toLowerCase()
  if (!cache_key) return

  let logo_url = String(row.logo_url || '').trim()
  try {
    const mirrored = await ensureMarketInstrumentLogoOnR2(row)
    if (mirrored) logo_url = mirrored
  } catch (e) {
    console.warn('[upsertMarketInstrument] R2 logo mirror skipped:', e instanceof Error ? e.message : e)
  }

  await admin.from('market_instruments').upsert({
    cache_key,
    display_symbol: String(row.display_symbol || '').trim().toUpperCase(),
    asset_class: row.asset_class,
    symbol: String(row.symbol || '').trim(),
    coin_id: row.coin_id ? String(row.coin_id).trim() : null,
    name: String(row.name || '').trim(),
    exchange: String(row.exchange || '').trim(),
    logo_url,
    market_cap_usd: row.market_cap_usd,
    listing_currency: String(row.listing_currency || 'USD').trim() || 'USD',
    metadata_updated_at: row.metadata_updated_at || new Date().toISOString(),
  })
}

export async function upsertMarketInstrumentFromEmbed(
  admin: SupabaseClient,
  embed: MarketEmbed,
): Promise<void> {
  await upsertMarketInstrument(admin, marketInstrumentFromEmbed(embed))
}
