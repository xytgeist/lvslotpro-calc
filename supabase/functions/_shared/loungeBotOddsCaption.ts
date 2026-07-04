/**
 * Sports odds caption templates (The Odds API JSON).
 */

const CAPTION_MAX = 500

export const DEFAULT_ODDS_WINDOW_HOURS = 48
export const DEFAULT_MIN_BOOKS = 3
export const DEFAULT_MAX_EDGE_PCT = 18

type Outcome = { name?: string; price?: number }
type Market = { key?: string; outcomes?: Outcome[] }
type Bookmaker = { key?: string; title?: string; markets?: Market[] }
type OddsEvent = {
  id?: string
  sport_key?: string
  home_team?: string
  away_team?: string
  commence_time?: string
  bookmakers?: Bookmaker[]
}

export type OddsPick = {
  sportKey: string
  eventId: string
  homeTeam: string
  awayTeam: string
  commenceTime: string
  marketKey: string
  pickName: string
  pickPrice: number
  bookTitle: string
  consensusPrice: number
  edgePct: number
  bookCount: number
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b)
  if (!s.length) return 0
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function americanToImplied(price: number): number {
  if (!Number.isFinite(price) || price === 0) return 0
  if (price > 0) return 100 / (price + 100)
  return (-price) / ((-price) + 100)
}

function impliedToAmerican(prob: number): number {
  if (!Number.isFinite(prob) || prob <= 0 || prob >= 1) return 0
  if (prob >= 0.5) return Math.round(-100 * prob / (1 - prob))
  return Math.round(100 * (1 - prob) / prob)
}

/** Only games starting within the next N hours (actionable slate, not season-long futures). */
export function filterOddsEventsByWindow(
  events: OddsEvent[],
  maxHoursAhead = DEFAULT_ODDS_WINDOW_HOURS,
): OddsEvent[] {
  const now = Date.now()
  const maxMs = now + maxHoursAhead * 3_600_000
  return events.filter((ev) => {
    const t = Date.parse(String(ev.commence_time || ''))
    if (!Number.isFinite(t)) return false
    return t > now && t <= maxMs
  })
}

export function formatOddsCommenceTime(iso: string): string {
  const t = Date.parse(String(iso || ''))
  if (!Number.isFinite(t)) return ''
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(t))
}

type PickOptions = {
  minBooks?: number
  maxEdgePct?: number
}

/** Find best h2h or spread pick vs consensus implied probability. */
export function pickBestOddsCandidate(
  events: OddsEvent[],
  sportKey: string,
  opts: PickOptions = {},
): OddsPick | null {
  const minBooks = opts.minBooks ?? DEFAULT_MIN_BOOKS
  const maxEdgePct = opts.maxEdgePct ?? DEFAULT_MAX_EDGE_PCT
  let best: OddsPick | null = null

  for (const ev of events) {
    const home = String(ev.home_team || 'Home').trim()
    const away = String(ev.away_team || 'Away').trim()
    const commenceTime = String(ev.commence_time || '').trim()
    if (!home || !away || !commenceTime) continue

    for (const marketKey of ['h2h', 'spreads'] as const) {
      const pricesByOutcome = new Map<string, number[]>()
      const bookByOutcome = new Map<string, { price: number; book: string }>()

      for (const book of ev.bookmakers || []) {
        const market = (book.markets || []).find((m) => m.key === marketKey)
        if (!market) continue
        for (const out of market.outcomes || []) {
          const name = String(out.name || '').trim()
          const price = Number(out.price)
          if (!name || !Number.isFinite(price)) continue
          const list = pricesByOutcome.get(name) || []
          list.push(price)
          pricesByOutcome.set(name, list)
          const cur = bookByOutcome.get(name)
          if (!cur || price > cur.price) {
            bookByOutcome.set(name, { price, book: String(book.title || book.key || 'Book') })
          }
        }
      }

      for (const [name, prices] of pricesByOutcome.entries()) {
        if (prices.length < minBooks) continue

        const implied = prices
          .map(americanToImplied)
          .filter((p) => p > 0 && p < 1)
        if (implied.length < minBooks) continue

        const consensusImplied = median(implied)
        const pick = bookByOutcome.get(name)
        if (!pick) continue

        const pickImplied = americanToImplied(pick.price)
        if (pickImplied <= 0 || pickImplied >= 1) continue

        const edge = (pickImplied - consensusImplied) * 100
        if (edge <= 0 || edge > maxEdgePct) continue

        if (!best || edge > best.edgePct) {
          best = {
            sportKey,
            eventId: String(ev.id || `${home}-${away}`),
            homeTeam: home,
            awayTeam: away,
            commenceTime,
            marketKey,
            pickName: name,
            pickPrice: pick.price,
            bookTitle: pick.book,
            consensusPrice: impliedToAmerican(consensusImplied),
            edgePct: Math.round(edge * 10) / 10,
            bookCount: prices.length,
          }
        }
      }
    }
  }

  return best
}

export function buildOddsPickCaption(pick: OddsPick): string {
  const when = formatOddsCommenceTime(pick.commenceTime)
  const priceStr = pick.pickPrice > 0 ? `+${pick.pickPrice}` : String(pick.pickPrice)
  const line =
    pick.marketKey === 'spreads'
      ? `${pick.pickName} spread ${priceStr} at ${pick.bookTitle}.`
      : `Best bet: ${pick.pickName} ML ${priceStr} at ${pick.bookTitle}.`

  const prefix = when ? `${when}: ${pick.awayTeam} @ ${pick.homeTeam}.` : `${pick.awayTeam} @ ${pick.homeTeam}.`
  const cap = `${prefix} ${line} Edge ~${pick.edgePct}% vs ${pick.bookCount}-book consensus.`
  return cap.length <= CAPTION_MAX ? cap : cap.slice(0, CAPTION_MAX - 1) + '…'
}

export function oddsExternalKey(pick: OddsPick): string {
  const day = new Date().toISOString().slice(0, 10)
  return `odds:${pick.sportKey}:${pick.eventId}:${pick.marketKey}:${pick.pickName}:${day}`
}
