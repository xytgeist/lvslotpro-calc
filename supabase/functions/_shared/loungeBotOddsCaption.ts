/**
 * Sports odds caption templates (The Odds API JSON).
 */

const CAPTION_MAX = 500

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
  marketKey: string
  pickName: string
  pickPrice: number
  bookTitle: string
  consensusPrice: number
  edgePct: number
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

/** Find best h2h or spread pick vs consensus. */
export function pickBestOddsCandidate(events: OddsEvent[], sportKey: string): OddsPick | null {
  let best: OddsPick | null = null

  for (const ev of events) {
    const home = String(ev.home_team || 'Home').trim()
    const away = String(ev.away_team || 'Away').trim()
    if (!home || !away) continue

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
          if (!cur || (marketKey === 'h2h' ? price > cur.price : price > cur.price)) {
            bookByOutcome.set(name, { price, book: String(book.title || book.key || 'Book') })
          }
        }
      }

      for (const [name, prices] of pricesByOutcome.entries()) {
        if (prices.length < 2) continue
        const consensus = median(prices)
        const pick = bookByOutcome.get(name)
        if (!pick) continue
        const edge = Math.abs(americanToImplied(pick.price) - americanToImplied(consensus)) * 100
        if (!best || edge > best.edgePct) {
          best = {
            sportKey,
            eventId: String(ev.id || `${home}-${away}`),
            homeTeam: home,
            awayTeam: away,
            marketKey,
            pickName: name,
            pickPrice: pick.price,
            bookTitle: pick.book,
            consensusPrice: consensus,
            edgePct: Math.round(edge * 10) / 10,
          }
        }
      }
    }
  }

  return best
}

export function buildOddsPickCaption(pick: OddsPick): string {
  const priceStr = pick.pickPrice > 0 ? `+${pick.pickPrice}` : String(pick.pickPrice)
  const line =
    pick.marketKey === 'spreads'
      ? `${pick.pickName} spread ${priceStr} at ${pick.bookTitle}.`
      : `Best bet: ${pick.pickName} ML ${priceStr} at ${pick.bookTitle}.`

  const cap = `${pick.awayTeam} @ ${pick.homeTeam}. ${line} Edge ~${pick.edgePct}% vs consensus.`
  return cap.length <= CAPTION_MAX ? cap : cap.slice(0, CAPTION_MAX - 1) + '…'
}

export function oddsExternalKey(pick: OddsPick): string {
  const day = new Date().toISOString().slice(0, 10)
  return `odds:${pick.sportKey}:${pick.eventId}:${pick.marketKey}:${pick.pickName}:${day}`
}
