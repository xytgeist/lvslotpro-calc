/**
 * Scoring for financial wire bot candidates (0–100).
 */

const HIGH_KEYWORDS = [
  'earnings',
  'cpi',
  'fed',
  'fomc',
  'rate cut',
  'rate hike',
  'guidance',
  'merger',
  'acquisition',
  'm&a',
  'ipo',
  'bankruptcy',
  'downgrade',
  'upgrade',
  'premarket',
  'after hours',
  'after-hours',
  'beats',
  'misses',
  'revenue',
  'profit',
  'inflation',
  'jobs report',
  'gdp',
  'tariff',
  'sec ',
  '8-k',
  '10-q',
  '10-k',
]

const DROP_KEYWORDS = [
  'how to',
  'top 10',
  'best stocks',
  'crypto giveaway',
  'sponsored',
  'advertisement',
  'quiz',
]

const CASHTAG_RE = /\$([A-Za-z][A-Za-z0-9.-]{0,14})\b/g

export type NewsCandidate = {
  title: string
  summary?: string
  url?: string
  publishedAt?: string | null
  tickers?: string[]
  sourceName?: string
}

export function extractTickers(text: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  CASHTAG_RE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = CASHTAG_RE.exec(text)) !== null) {
    const sym = String(m[1] || '').toUpperCase()
    if (sym && !seen.has(sym)) {
      seen.add(sym)
      out.push(sym)
    }
  }
  return out
}

/** Normalize title for dedupe clustering. */
export function normalizeTitleHash(title: string): string {
  return String(title || '')
    .toLowerCase()
    .replace(/[^\w\s$]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240)
}

export function scoreNewsCandidate(
  item: NewsCandidate,
  opts: { watchlistTickers?: string[]; minTitleLength?: number } = {},
): number {
  const title = String(item.title || '').trim()
  const summary = String(item.summary || '').trim()
  const blob = `${title} ${summary}`.toLowerCase()
  if (!title || title.length < (opts.minTitleLength ?? 12)) return 0

  for (const bad of DROP_KEYWORDS) {
    if (blob.includes(bad)) return 0
  }

  let score = 35

  for (const kw of HIGH_KEYWORDS) {
    if (blob.includes(kw)) score += 8
  }

  const tickers = item.tickers?.length
    ? item.tickers
    : extractTickers(`${title} ${summary}`)
  if (tickers.length > 0) score += 12
  if (tickers.length > 2) score += 4

  const watch = new Set((opts.watchlistTickers || []).map((t) => t.toUpperCase()))
  if (watch.size > 0 && tickers.some((t) => watch.has(t.toUpperCase()))) {
    score += 15
  }

  const ageMs = item.publishedAt ? Date.now() - new Date(item.publishedAt).getTime() : null
  if (ageMs != null && Number.isFinite(ageMs)) {
    if (ageMs < 30 * 60_000) score += 12
    else if (ageMs < 2 * 3600_000) score += 8
    else if (ageMs < 6 * 3600_000) score += 4
    else if (ageMs > 48 * 3600_000) score -= 20
  }

  if (title.length > 180) score -= 5

  return Math.max(0, Math.min(100, Math.round(score)))
}
