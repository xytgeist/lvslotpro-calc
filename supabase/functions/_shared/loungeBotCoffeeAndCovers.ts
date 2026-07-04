/**
 * Coffee & Covers — Scott Sharpe morning roundup.
 * Covers (spread +EV) lead the post; then optional ML spots; then today's best lines board.
 */

import {
  DEFAULT_MAX_EV_PCT,
  DEFAULT_MIN_BOOKS,
  extractSlateGameBestLines,
  findPlusEvOpportunities,
  formatAmericanOdds,
  formatBookDisplayName,
  formatOddsCommenceTimeShort,
  type OddsEvent,
  type OddsPick,
} from './loungeBotOddsCaption.ts'

/** Min +EV % on $1 for ML spots in the morning post. */
export const COFFEE_ML_EV_THRESHOLD_PCT = 3
/** Min +EV % on $1 for spread "cover" picks. */
export const COFFEE_SPREAD_EV_THRESHOLD_PCT = 4
/** Max cover or ML highlights per sport in one post. */
export const COFFEE_MAX_PICKS_PER_SPORT = 3

const CAPTION_MAX = 2000
const NO_COVERS_LINE =
  'Sitting on hands today until we find something worth calling.'

type Outcome = { name?: string; price?: number; point?: number }
type Market = { key?: string; outcomes?: Outcome[] }
type Bookmaker = { key?: string; title?: string; markets?: Market[] }

export type SpreadPick = {
  sportKey: string
  eventId: string
  homeTeam: string
  awayTeam: string
  commenceTime: string
  pickName: string
  pickPoint: number
  pickPrice: number
  bookTitle: string
  consensusPrice: number
  edgePct: number
  bookCount: number
}

export type CoffeeAndCoversOptions = {
  categoryLabel: string
  sportKey: string
  events: OddsEvent[]
  minBooks?: number
  mlEvThresholdPct?: number
  spreadEvThresholdPct?: number
  maxPicksPerSport?: number
  maxEvPct?: number
}

export type CoffeeAndCoversResult = {
  caption: string
  coverPicks: SpreadPick[]
  mlPicks: OddsPick[]
  gameCount: number
  hasCovers: boolean
}

function shortDisplayName(name: string): string {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return parts[0] || ''
  return parts[parts.length - 1]!
}

function americanToImplied(price: number): number {
  if (!Number.isFinite(price) || price === 0) return 0
  if (price > 0) return 100 / (price + 100)
  return Math.abs(price) / (Math.abs(price) + 100)
}

function americanProfitIfWin(price: number, stake = 1): number {
  if (!Number.isFinite(price) || price === 0 || stake <= 0) return 0
  if (price > 0) return (price / 100) * stake
  return (100 / Math.abs(price)) * stake
}

function computeEvDecimal(consensusProb: number, americanPrice: number, stake = 1): number {
  if (!Number.isFinite(consensusProb) || consensusProb <= 0 || consensusProb >= 1) return 0
  const profit = americanProfitIfWin(americanPrice, stake)
  return consensusProb * profit - (1 - consensusProb) * stake
}

function impliedToAmerican(prob: number): number {
  if (!Number.isFinite(prob) || prob <= 0 || prob >= 1) return 0
  if (prob >= 0.5) return Math.round(-100 * prob / (1 - prob))
  return Math.round(100 * (1 - prob) / prob)
}

function average(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function spreadOutcomeKey(name: string, point: number): string {
  return `${name}|${point.toFixed(1)}`
}

function devigFairProbsForSpread(market: Market): Map<string, number> | null {
  const implied = new Map<string, number>()
  for (const out of market.outcomes || []) {
    const name = String(out.name || '').trim()
    const price = Number(out.price)
    const point = Number(out.point)
    if (!name || !Number.isFinite(price) || !Number.isFinite(point)) continue
    const imp = americanToImplied(price)
    if (imp <= 0 || imp >= 1) continue
    implied.set(spreadOutcomeKey(name, point), imp)
  }
  if (implied.size < 2) return null
  const sum = [...implied.values()].reduce((a, b) => a + b, 0)
  if (sum <= 0) return null
  const fair = new Map<string, number>()
  for (const [key, imp] of implied) {
    fair.set(key, imp / sum)
  }
  return fair
}

function formatSpreadPoint(point: number): string {
  if (!Number.isFinite(point)) return ''
  const rounded = Math.round(point * 2) / 2
  return rounded > 0 ? `+${rounded}` : String(rounded)
}

function formatSpreadPickLine(pick: SpreadPick): string {
  const team = shortDisplayName(pick.pickName)
  const spread = formatSpreadPoint(pick.pickPoint)
  const juice = formatAmericanOdds(pick.pickPrice)
  const fair = formatAmericanOdds(pick.consensusPrice)
  const when = formatOddsCommenceTimeShort(pick.commenceTime)
  const away = shortDisplayName(pick.awayTeam)
  const home = shortDisplayName(pick.homeTeam)
  return [
    `${away} vs ${home}, ${when}`,
    `${team} ${spread} (${juice}) at ${pick.bookTitle}`,
    `Fair ${fair} (${pick.bookCount} books) · +${pick.edgePct}% EV`,
  ].join('\n')
}

function formatMlSpotLine(pick: OddsPick): string {
  const team = shortDisplayName(pick.pickName)
  const odds = formatAmericanOdds(pick.pickPrice)
  const fair = formatAmericanOdds(pick.consensusPrice)
  const when = formatOddsCommenceTimeShort(pick.commenceTime)
  const away = shortDisplayName(pick.awayTeam)
  const home = shortDisplayName(pick.homeTeam)
  return [
    `${away} vs ${home}, ${when}`,
    `${team} ML ${odds} at ${pick.bookTitle}`,
    `Fair ${fair} (${pick.bookCount} books) · +${pick.edgePct}% EV`,
  ].join('\n')
}

function formatSlateGameBlock(game: ReturnType<typeof extractSlateGameBestLines>[number]): string {
  const away = shortDisplayName(game.awayTeam)
  const home = shortDisplayName(game.homeTeam)
  const when = formatOddsCommenceTimeShort(game.commenceTime)
  const head = when ? `${away} vs ${home}, ${when}` : `${away} vs ${home}`
  const oddsLine = game.picks
    .map((p) => `${p.label} ${formatAmericanOdds(p.price)} (${p.book})`)
    .join(', ')
  return `${head}\n${oddsLine}`
}

function joinCaptionLines(lines: string[]): string {
  const cap = lines.join('\n').trim()
  return cap.length <= CAPTION_MAX ? cap : `${cap.slice(0, CAPTION_MAX - 3)}...`
}

/**
 * Find spread cover opportunities: devig per book, consensus fair prob, EV on best juice.
 */
export function findPlusEvSpreadOpportunities(
  events: OddsEvent[],
  sportKey: string,
  opts: {
    minBooks?: number
    minEvPct?: number
    maxEvPct?: number
  } = {},
): SpreadPick[] {
  const minBooks = opts.minBooks ?? DEFAULT_MIN_BOOKS
  const minEvPct = opts.minEvPct ?? COFFEE_SPREAD_EV_THRESHOLD_PCT
  const maxEvPct = opts.maxEvPct ?? DEFAULT_MAX_EV_PCT
  const opportunities: SpreadPick[] = []

  for (const ev of events) {
    const home = String(ev.home_team || 'Home').trim()
    const away = String(ev.away_team || 'Away').trim()
    const commenceTime = String(ev.commence_time || '').trim()
    if (!home || !away || !commenceTime) continue

    const fairSamplesByKey = new Map<string, number[]>()
    const bestPriceByKey = new Map<string, { price: number; book: string; point: number; name: string }>()

    for (const book of ev.bookmakers || []) {
      const market = (book.markets || []).find((m) => m.key === 'spreads')
      if (!market) continue
      const fair = devigFairProbsForSpread(market)
      if (!fair?.size) continue
      const bookLabel = formatBookDisplayName(String(book.title || ''), book.key)

      for (const out of market.outcomes || []) {
        const name = String(out.name || '').trim()
        const price = Number(out.price)
        const point = Number(out.point)
        if (!name || !Number.isFinite(price) || !Number.isFinite(point)) continue
        const key = spreadOutcomeKey(name, point)
        const fairProb = fair.get(key)
        if (fairProb == null) continue

        const samples = fairSamplesByKey.get(key) || []
        samples.push(fairProb)
        fairSamplesByKey.set(key, samples)

        const cur = bestPriceByKey.get(key)
        if (!cur || price > cur.price) {
          bestPriceByKey.set(key, { price, book: bookLabel, point, name })
        }
      }
    }

    for (const [key, samples] of fairSamplesByKey) {
      if (samples.length < minBooks) continue
      const best = bestPriceByKey.get(key)
      if (!best) continue

      const consensusProb = average(samples)
      const evDecimal = computeEvDecimal(consensusProb, best.price, 1)
      const evPct = Math.round(evDecimal * 1000) / 10
      if (evPct < minEvPct || evPct > maxEvPct) continue

      opportunities.push({
        sportKey,
        eventId: String(ev.id || `${home}-${away}`),
        homeTeam: home,
        awayTeam: away,
        commenceTime,
        pickName: best.name,
        pickPoint: best.point,
        pickPrice: best.price,
        bookTitle: best.book,
        consensusPrice: impliedToAmerican(consensusProb),
        edgePct: evPct,
        bookCount: samples.length,
      })
    }
  }

  opportunities.sort((a, b) => b.edgePct - a.edgePct)
  return opportunities
}

/**
 * Build the Coffee & Covers morning caption for one calendar sport.
 */
export function generateCoffeeAndCovers(input: CoffeeAndCoversOptions): CoffeeAndCoversResult {
  const categoryLabel = String(input.categoryLabel || '').trim()
  const sportKey = String(input.sportKey || '').trim()
  const events = Array.isArray(input.events) ? input.events : []
  const minBooks = input.minBooks ?? DEFAULT_MIN_BOOKS
  const mlThreshold = input.mlEvThresholdPct ?? COFFEE_ML_EV_THRESHOLD_PCT
  const spreadThreshold = input.spreadEvThresholdPct ?? COFFEE_SPREAD_EV_THRESHOLD_PCT
  const maxPicks = input.maxPicksPerSport ?? COFFEE_MAX_PICKS_PER_SPORT
  const maxEvPct = input.maxEvPct ?? DEFAULT_MAX_EV_PCT

  const coverPicks = findPlusEvSpreadOpportunities(events, sportKey, {
    minBooks,
    minEvPct: spreadThreshold,
    maxEvPct,
  }).slice(0, maxPicks)

  const mlPicks = findPlusEvOpportunities(events, sportKey, {
    minBooks,
    minEvPct: mlThreshold,
    maxEvPct,
  }).slice(0, maxPicks)

  const games = extractSlateGameBestLines(events)
  const lines: string[] = ['Coffee & Covers']
  if (categoryLabel) lines.push(categoryLabel)
  lines.push('')

  lines.push('Covers')
  if (coverPicks.length) {
    for (const pick of coverPicks) {
      lines.push(formatSpreadPickLine(pick))
      lines.push('')
    }
  } else {
    lines.push(NO_COVERS_LINE)
    lines.push('')
  }

  if (mlPicks.length) {
    lines.push('ML spots')
    for (const pick of mlPicks) {
      lines.push(formatMlSpotLine(pick))
      lines.push('')
    }
  }

  lines.push("Today's lines")
  if (!games.length) {
    lines.push('No games on today\'s board.')
  } else {
    let included = 0
    for (let i = 0; i < games.length; i++) {
      const trialLines = [...lines, formatSlateGameBlock(games[i]), '']
      const omitted = games.length - i - 1
      if (omitted > 0) trialLines.push(`+${omitted} more games today.`)
      if (joinCaptionLines(trialLines).length <= CAPTION_MAX) {
        included = i + 1
      } else if (included === 0 && i === 0) {
        included = 1
        break
      } else {
        break
      }
    }
    for (let i = 0; i < included; i++) {
      lines.push(formatSlateGameBlock(games[i]))
      lines.push('')
    }
    const omitted = games.length - included
    if (omitted > 0) lines.push(`+${omitted} more games today.`)
  }

  return {
    caption: joinCaptionLines(lines),
    coverPicks,
    mlPicks,
    gameCount: games.length,
    hasCovers: coverPicks.length > 0,
  }
}

export function coffeeCoversDedupeKey(calendarSlug: string, ptDay: string): string {
  return `coffee:${calendarSlug}:${ptDay}`
}
