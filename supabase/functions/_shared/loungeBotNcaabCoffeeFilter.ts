/**
 * NCAAB Coffee & Covers slate filter — prioritize high-interest games on big boards.
 *
 * Order: AP Top 25 → power-conference matchups → spread line movement (≥0.5)
 * → rivalry or high-total games. Caps at ~40 games/day.
 *
 * Update `ncaab-ap-top25-keys.json` weekly during the season.
 */
import type { OddsEvent } from './loungeBotOddsCaption.ts'
import { extractEventLines, type EventLineRow } from './loungeBotLineMovement.ts'
import AP_TOP_25_KEYS from './ncaab-ap-top25-keys.json' with { type: 'json' }
import POWER_CONF_KEYS from './ncaab-power-primary-keys.json' with { type: 'json' }

/** Max games mentioned in Coffee & Covers NCAAB thread. */
export const NCAAB_COFFEE_MAX_GAMES = 40
/** Spread move (pts) vs prior poll snapshot for tier-3 interest. */
export const NCAAB_COFFEE_SPREAD_MOVE_MIN = 0.5
/** Consensus O/U at or above this counts as a high-total game. */
export const NCAAB_COFFEE_HIGH_TOTAL_MIN = 155

const AP_TOP_25 = new Set(AP_TOP_25_KEYS as string[])
const POWER_CONF = new Set(POWER_CONF_KEYS as string[])

/** Rivalry pairs as key aliases (Odds API / Rundown style). */
const RIVALRIES: ReadonlyArray<readonly [readonly string[], readonly string[]]> = [
  [['alabama crimson tide', 'alabama'], ['auburn tigers', 'auburn']],
  [['arizona wildcats', 'arizona'], ['arizona state sun devils', 'arizona state']],
  [['baylor bears', 'baylor'], ['tcu horned frogs', 'tcu']],
  [['cincinnati bearcats', 'cincinnati'], ['xavier musketeers', 'xavier']],
  [['duke blue devils', 'duke'], ['north carolina tar heels', 'north carolina']],
  [['florida gators', 'florida'], ['florida state seminoles', 'florida state']],
  [['georgetown hoyas', 'georgetown'], ['syracuse orange', 'syracuse']],
  [['gonzaga bulldogs', 'gonzaga'], ["saint mary's gaels", 'saint mary s gaels', 'st marys gaels']],
  [['indiana hoosiers', 'indiana'], ['purdue boilermakers', 'purdue']],
  [['iowa hawkeyes', 'iowa'], ['iowa state cyclones', 'iowa state']],
  [['kansas jayhawks', 'kansas'], ['kansas state wildcats', 'kansas state']],
  [['kentucky wildcats', 'kentucky'], ['louisville cardinals', 'louisville']],
  [['michigan wolverines', 'michigan'], ['michigan state spartans', 'michigan state']],
  [['michigan wolverines', 'michigan'], ['ohio state buckeyes', 'ohio state']],
  [['ole miss rebels', 'ole miss', 'mississippi'], ['mississippi state bulldogs', 'mississippi state']],
  [['oklahoma sooners', 'oklahoma'], ['oklahoma state cowboys', 'oklahoma state']],
  [['oregon ducks', 'oregon'], ['oregon state beavers', 'oregon state']],
  [['texas longhorns', 'texas'], ['texas a m aggies', 'texas a&m aggies', 'texas am aggies']],
  [['ucla bruins', 'ucla'], ['usc trojans', 'usc', 'southern california trojans']],
  [['villanova wildcats', 'villanova'], ['georgetown hoyas', 'georgetown']],
  [['washington huskies', 'washington'], ['washington state cougars', 'washington state']],
  [['wisconsin badgers', 'wisconsin'], ['minnesota golden gophers', 'minnesota']],
]

function normTeam(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function teamMatchesKeySet(teamName: string, keys: Set<string>): boolean {
  const token = normTeam(teamName)
  if (!token) return false
  const last = token.split(' ').pop() || ''
  for (const key of keys) {
    const k = normTeam(key)
    if (!k) continue
    if (token === k || token.includes(k) || k.includes(token) || last === k) return true
  }
  return false
}

export function isNcaabCoffeeSport(sportKey: string, categoryLabel?: string): boolean {
  const sk = String(sportKey || '').trim().toLowerCase()
  if (sk === 'basketball_ncaab') return true
  const label = String(categoryLabel || '').trim().toLowerCase()
  return label.includes('march madness') || label.includes('ncaab')
}

function median(nums: number[]): number | null {
  const sorted = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b)
  if (!sorted.length) return null
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!
}

function consensusGameTotal(event: OddsEvent): number | null {
  const totals: number[] = []
  for (const book of event.bookmakers || []) {
    const market = (book.markets || []).find((m) => m.key === 'totals')
    if (!market) continue
    for (const out of market.outcomes || []) {
      const name = String(out.name || '').trim().toLowerCase()
      const point = out.point != null ? Number(out.point) : null
      if ((name === 'over' || name.startsWith('over ')) && point != null && Number.isFinite(point)) {
        totals.push(point)
      }
    }
  }
  return totals.length ? median(totals) : null
}

export function maxSpreadPointMove(
  event: OddsEvent,
  sportKey: string,
  previous: EventLineRow[],
): number {
  const eventId = String(event.id || '').trim()
  if (!eventId || !previous.length) return 0

  const current = extractEventLines(event, sportKey).filter((r) => r.marketKey === 'spreads')
  const prevByOutcome = new Map(
    previous
      .filter((r) => r.eventId === eventId && r.marketKey === 'spreads')
      .map((r) => [r.outcomeName, r]),
  )

  let maxMove = 0
  for (const row of current) {
    const prev = prevByOutcome.get(row.outcomeName)
    if (!prev || row.linePoint == null || prev.linePoint == null) continue
    maxMove = Math.max(maxMove, Math.abs(row.linePoint - prev.linePoint))
  }
  return maxMove
}

function isRivalryGame(homeTeam: string, awayTeam: string): boolean {
  for (const [sideA, sideB] of RIVALRIES) {
    const setA = new Set(sideA)
    const setB = new Set(sideB)
    const homeA = teamMatchesKeySet(homeTeam, setA)
    const awayB = teamMatchesKeySet(awayTeam, setB)
    const homeB = teamMatchesKeySet(homeTeam, setB)
    const awayA = teamMatchesKeySet(awayTeam, setA)
    if ((homeA && awayB) || (homeB && awayA)) return true
  }
  return false
}

function hasRankedTeam(homeTeam: string, awayTeam: string): boolean {
  return teamMatchesKeySet(homeTeam, AP_TOP_25) || teamMatchesKeySet(awayTeam, AP_TOP_25)
}

function isPowerConferenceMatchup(homeTeam: string, awayTeam: string): boolean {
  return teamMatchesKeySet(homeTeam, POWER_CONF) && teamMatchesKeySet(awayTeam, POWER_CONF)
}

type TierBucket = 1 | 2 | 3 | 4

type ScoredEvent = {
  event: OddsEvent
  tier: TierBucket
  subScore: number
}

function scoreNcaabCoffeeEvent(
  event: OddsEvent,
  sportKey: string,
  previous: EventLineRow[],
): ScoredEvent | null {
  const home = String(event.home_team || '').trim()
  const away = String(event.away_team || '').trim()
  if (!home || !away) return null

  const spreadMove = maxSpreadPointMove(event, sportKey, previous)
  const total = consensusGameTotal(event)
  const highTotal = total != null && total >= NCAAB_COFFEE_HIGH_TOTAL_MIN

  if (hasRankedTeam(home, away)) {
    return { event, tier: 1, subScore: spreadMove * 10 + (total ?? 0) }
  }
  if (isPowerConferenceMatchup(home, away)) {
    return { event, tier: 2, subScore: spreadMove * 10 + (total ?? 0) }
  }
  if (spreadMove >= NCAAB_COFFEE_SPREAD_MOVE_MIN) {
    return { event, tier: 3, subScore: spreadMove * 100 + (total ?? 0) }
  }
  if (isRivalryGame(home, away) || highTotal) {
    return {
      event,
      tier: 4,
      subScore: (isRivalryGame(home, away) ? 1000 : 0) + (total ?? 0),
    }
  }
  return null
}

/**
 * Waterfall-priority filter for NCAAB Coffee & Covers.
 * Returns up to NCAAB_COFFEE_MAX_GAMES events, preserving tier order.
 */
export function filterNcaabCoffeeEvents(
  events: OddsEvent[],
  sportKey: string,
  previous: EventLineRow[] = [],
  maxGames = NCAAB_COFFEE_MAX_GAMES,
): { events: OddsEvent[]; totalBefore: number } {
  const totalBefore = events.length
  if (!events.length) return { events: [], totalBefore: 0 }

  const scored = events
    .map((ev) => scoreNcaabCoffeeEvent(ev, sportKey, previous))
    .filter((row): row is ScoredEvent => row != null)

  const buckets: ScoredEvent[][] = [[], [], [], []]
  for (const row of scored) buckets[row.tier - 1]!.push(row)

  const sortBucket = (a: ScoredEvent, b: ScoredEvent) => {
    if (b.subScore !== a.subScore) return b.subScore - a.subScore
    return Date.parse(String(a.event.commence_time || '')) - Date.parse(String(b.event.commence_time || ''))
  }

  for (const bucket of buckets) bucket.sort(sortBucket)

  const picked: OddsEvent[] = []
  const seen = new Set<string>()
  for (const bucket of buckets) {
    for (const row of bucket) {
      const id = String(row.event.id || `${row.event.away_team}-${row.event.home_team}-${row.event.commence_time}`)
      if (seen.has(id)) continue
      seen.add(id)
      picked.push(row.event)
      if (picked.length >= maxGames) break
    }
    if (picked.length >= maxGames) break
  }

  picked.sort(
    (a, b) => Date.parse(String(a.commence_time || '')) - Date.parse(String(b.commence_time || '')),
  )

  return { events: picked, totalBefore }
}

export function maybeFilterNcaabCoffeeEvents(
  events: OddsEvent[],
  sportKey: string,
  categoryLabel?: string,
  previous: EventLineRow[] = [],
): { events: OddsEvent[]; totalBefore: number } {
  if (!isNcaabCoffeeSport(sportKey, categoryLabel)) {
    return { events, totalBefore: events.length }
  }
  return filterNcaabCoffeeEvents(events, sportKey, previous)
}
