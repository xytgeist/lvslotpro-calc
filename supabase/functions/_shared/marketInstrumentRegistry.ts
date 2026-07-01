import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
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

export async function upsertMarketInstrument(
  admin: SupabaseClient,
  row: MarketInstrumentRow,
): Promise<void> {
  const cache_key = String(row.cache_key || '').trim().toLowerCase()
  if (!cache_key) return
  await admin.from('market_instruments').upsert({
    cache_key,
    display_symbol: String(row.display_symbol || '').trim().toUpperCase(),
    asset_class: row.asset_class,
    symbol: String(row.symbol || '').trim(),
    coin_id: row.coin_id ? String(row.coin_id).trim() : null,
    name: String(row.name || '').trim(),
    exchange: String(row.exchange || '').trim(),
    logo_url: String(row.logo_url || '').trim(),
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
