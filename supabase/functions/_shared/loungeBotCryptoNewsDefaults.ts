/** Crypto Edge bot slug (crypto wire aggregator). */
export const DEFAULT_CRYPTO_EDGE_SLUG = 'crypto-edge'

export type CryptoNewsSourceSeed = {
  name: string
  kind: string
  poll_url?: string | null
  api_config?: Record<string, unknown>
  poll_interval_sec: number
}

/**
 * Tier 1 + Tier 2 crypto allowlist — no Market Edge macro/EDGAR blend.
 * Headline rewrite + source link only (no full-body republish).
 */
export const DEFAULT_CRYPTO_NEWS_SOURCES: CryptoNewsSourceSeed[] = [
  // Tier 1
  { name: 'Finnhub crypto', kind: 'finnhub_category', api_config: { category: 'crypto' }, poll_interval_sec: 180 },
  {
    name: 'CoinDesk',
    kind: 'rss',
    poll_url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    api_config: { source_label: 'CoinDesk' },
    poll_interval_sec: 180,
  },
  {
    name: 'The Block',
    kind: 'rss',
    poll_url: 'https://www.theblock.co/rss.xml',
    api_config: { source_label: 'The Block' },
    poll_interval_sec: 240,
  },
  {
    name: 'Decrypt',
    kind: 'rss',
    poll_url: 'https://decrypt.co/feed',
    api_config: { source_label: 'Decrypt' },
    poll_interval_sec: 300,
  },
  {
    name: 'CFTC press releases',
    kind: 'rss',
    poll_url: 'https://www.cftc.gov/PressRoom/PressReleases/rss.xml',
    api_config: { source_label: 'CFTC' },
    poll_interval_sec: 420,
  },
  {
    name: 'SEC press releases',
    kind: 'rss',
    poll_url: 'https://www.sec.gov/news/pressreleases.rss',
    api_config: { source_label: 'SEC' },
    poll_interval_sec: 300,
  },

  // Tier 2
  {
    name: 'Bitcoin Magazine',
    kind: 'rss',
    poll_url: 'https://bitcoinmagazine.com/.rss/full/',
    api_config: { source_label: 'Bitcoin Magazine' },
    poll_interval_sec: 600,
  },
  {
    name: 'CryptoSlate',
    kind: 'rss',
    poll_url: 'https://cryptoslate.com/feed/',
    api_config: { source_label: 'CryptoSlate' },
    poll_interval_sec: 420,
  },
  {
    name: 'CoinTelegraph',
    kind: 'rss',
    poll_url: 'https://cointelegraph.com/rss',
    api_config: { source_label: 'CoinTelegraph' },
    poll_interval_sec: 420,
  },
  {
    name: 'Federal Reserve press',
    kind: 'rss',
    poll_url: 'https://www.federalreserve.gov/feeds/press_all.xml',
    api_config: { source_label: 'Federal Reserve' },
    poll_interval_sec: 420,
  },
]

/** Optional portal watchlist — empty by default (topic tiers drive publishes). */
export const DEFAULT_CRYPTO_EDGE_WATCHLIST: readonly string[] = []
