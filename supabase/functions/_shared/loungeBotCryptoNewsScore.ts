/**
 * Topic-tier scoring for Crypto Edge (0–100).
 * Prioritizes market-moving crypto news — regulation, hacks, majors, DeFi stress.
 */

import {
  extractTickers,
  isBlockedNewsItem,
  normalizeTitleHash,
  type NewsCandidate,
  type TopicScoreResult,
} from './loungeBotNewsScore.ts'

const CRYPTO_TOPIC_TIERS: Array<{ id: string; weight: number; keywords: string[] }> = [
  {
    id: 'regulatory_enforcement',
    weight: 16,
    keywords: [
      'sec ',
      'securities and exchange',
      'cftc',
      'enforcement',
      'lawsuit',
      'charged',
      'indictment',
      'settlement',
      'subpoena',
      'wells notice',
      'crypto regul',
      'digital asset',
      'commodity futures',
      'money transmitter',
      'sanctions',
      'ofac',
    ],
  },
  {
    id: 'etf_approval',
    weight: 15,
    keywords: [
      'bitcoin etf',
      'ether etf',
      'ethereum etf',
      'spot etf',
      'etf approval',
      'etf reject',
      'blackrock',
      'fidelity',
      'grayscale',
      'in-kind',
      's-1',
      '19b-4',
    ],
  },
  {
    id: 'exchange_custody',
    weight: 14,
    keywords: [
      'coinbase',
      'binance',
      'kraken',
      'okx',
      'bybit',
      'ftx',
      'bankruptcy',
      'insolvency',
      'withdrawal halt',
      'withdrawals frozen',
      'proof of reserves',
      'custody',
      'cold storage',
      'delist',
      'listing',
    ],
  },
  {
    id: 'hack_exploit',
    weight: 14,
    keywords: [
      'hack',
      'hacked',
      'exploit',
      'exploited',
      'breach',
      'drained',
      'stolen',
      'rug pull',
      'bridge exploit',
      'smart contract bug',
      'private key',
      'phishing',
    ],
  },
  {
    id: 'major_assets',
    weight: 13,
    keywords: [
      'bitcoin',
      ' btc ',
      'ethereum',
      ' eth ',
      'solana',
      ' sol ',
      'xrp',
      'ripple',
      'dogecoin',
      'cardano',
      'avalanche',
      'polygon',
      'chainlink',
    ],
  },
  {
    id: 'liquidations',
    weight: 14,
    keywords: [
      'liquidated',
      'liquidation',
      'liquidations',
      'margin call',
      'cascade',
      'longs wiped',
      'shorts wiped',
      'funding rate',
      'open interest',
    ],
  },
  {
    id: 'prediction_markets',
    weight: 12,
    keywords: [
      'polymarket',
      'kalshi',
      'prediction market',
      'prediction markets',
      'betting odds',
    ],
  },
  {
    id: 'defi_protocol',
    weight: 12,
    keywords: [
      'defi',
      'de-fi',
      'tvl',
      'aave',
      'uniswap',
      'curve',
      'compound',
      'makerdao',
      'perpetual',
      'dex ',
      'lending protocol',
    ],
  },
  {
    id: 'stablecoin',
    weight: 11,
    keywords: [
      'stablecoin',
      'usdt',
      'usdc',
      'tether',
      'circle',
      'depeg',
      'de-peg',
      'issuer',
      'reserve attestation',
      'dai ',
    ],
  },
  {
    id: 'mining_halving',
    weight: 10,
    keywords: [
      'halving',
      'hashrate',
      'hash rate',
      'miner',
      'mining pool',
      'difficulty adjustment',
      'block reward',
    ],
  },
  {
    id: 'macro_crypto',
    weight: 10,
    keywords: [
      'federal reserve',
      'fomc',
      'rate cut',
      'rate hike',
      'inflation',
      'treasury',
      'yield',
      'liquidity',
      'risk-off',
      'risk on',
    ],
  },
  {
    id: 'funding_market',
    weight: 8,
    keywords: [
      'raises',
      'funding round',
      'seed round',
      'series a',
      'venture',
      'token sale',
      'ico',
      'airdrop',
    ],
  },
]

const CRYPTO_DROP_KEYWORDS = [
  'how to buy',
  'price prediction',
  'top 10',
  'best crypto',
  'crypto giveaway',
  'referral code',
  'nft giveaway',
  'sponsored',
  'advertisement',
  'horoscope',
  'celebrity',
  'watch live',
  'to the moon',
  '100x',
  'wagmi',
  ' lfg ',
  'not financial advice',
  'nfa ',
  'shill',
  '10-q filing',
  '10-k filing',
  '8-k filing',
]

function matchCryptoTopicTiers(blob: string): { matchedTiers: string[]; tierBonus: number } {
  const matchedTiers: string[] = []
  let tierBonus = 0
  for (const tier of CRYPTO_TOPIC_TIERS) {
    if (tier.keywords.some((kw) => blob.includes(kw))) {
      matchedTiers.push(tier.id)
      tierBonus += tier.weight
    }
  }
  return { matchedTiers, tierBonus }
}

export function scoreCryptoNewsCandidateDetailed(
  item: NewsCandidate,
  opts: { watchlistTickers?: string[]; minTitleLength?: number } = {},
): TopicScoreResult {
  if (isBlockedNewsItem(item)) {
    return { score: 0, matchedTiers: [] }
  }
  const title = String(item.title || '').trim()
  const summary = String(item.summary || '').trim()
  const blob = ` ${title} ${summary} `.toLowerCase()
  if (!title || title.length < (opts.minTitleLength ?? 12)) {
    return { score: 0, matchedTiers: [] }
  }

  for (const bad of CRYPTO_DROP_KEYWORDS) {
    if (blob.includes(bad)) return { score: 0, matchedTiers: [] }
  }

  const { matchedTiers, tierBonus } = matchCryptoTopicTiers(blob)

  if (!matchedTiers.length) {
    return { score: Math.min(40, 20 + (title.length > 40 ? 5 : 0)), matchedTiers: [] }
  }

  let score = 28 + tierBonus

  const tickers = item.tickers?.length
    ? item.tickers
    : extractTickers(`${title} ${summary}`)
  if (tickers.length > 0) score += 6
  if (tickers.length > 2) score += 3

  const source = String(item.sourceName || '').toLowerCase()
  if (source.includes('sec') || source.includes('cftc')) score += 8
  if (source.includes('federal reserve')) score += 6
  if (source.includes('coindesk') || source.includes('the block')) score += 5
  if (source.includes('decrypt') || source.includes('bitcoin magazine')) score += 4

  const watch = new Set((opts.watchlistTickers || []).map((t) => t.toUpperCase()).filter(Boolean))
  if (watch.size > 0 && tickers.some((t) => watch.has(t.toUpperCase()))) {
    score += 5
  }

  const ageMs = item.publishedAt ? Date.now() - new Date(item.publishedAt).getTime() : null
  if (ageMs != null && Number.isFinite(ageMs)) {
    if (ageMs < 30 * 60_000) score += 10
    else if (ageMs < 2 * 3600_000) score += 6
    else if (ageMs < 6 * 3600_000) score += 3
    else if (ageMs > 48 * 3600_000) score -= 18
  }

  if (title.length > 180) score -= 4

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    matchedTiers,
  }
}

export function scoreCryptoNewsCandidate(
  item: NewsCandidate,
  opts: { watchlistTickers?: string[]; minTitleLength?: number } = {},
): number {
  return scoreCryptoNewsCandidateDetailed(item, opts).score
}

export { normalizeTitleHash }
