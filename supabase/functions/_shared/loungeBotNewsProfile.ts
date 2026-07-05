import { DEFAULT_CRYPTO_EDGE_SLUG, DEFAULT_CRYPTO_NEWS_SOURCES } from './loungeBotCryptoNewsDefaults.ts'
import {
  DEFAULT_MARKET_NEWS_SOURCES,
  type MarketNewsSourceSeed,
} from './loungeBotMarketNewsDefaults.ts'

export type NewsProfile = 'market' | 'crypto'

export function newsProfileFromAccount(
  config: Record<string, unknown> | null,
  slug?: string,
): NewsProfile {
  const raw = String(config?.news_profile || '').trim().toLowerCase()
  if (raw === 'crypto') return 'crypto'
  if (String(slug || '').trim() === DEFAULT_CRYPTO_EDGE_SLUG) return 'crypto'
  return 'market'
}

export function defaultNewsSourcesForProfile(profile: NewsProfile): MarketNewsSourceSeed[] {
  return profile === 'crypto' ? DEFAULT_CRYPTO_NEWS_SOURCES : DEFAULT_MARKET_NEWS_SOURCES
}
