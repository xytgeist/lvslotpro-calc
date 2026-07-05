/**
 * Sport-specific analysis profiles for Scott Sharpe (+EV pick ranking, market scan set).
 * Future: enrich captions with TheRundown (pitchers, injuries, etc.) — see loungeBotRundownContext.ts
 */

export type SportMarketKey = 'h2h' | 'spreads' | 'totals'

/** Extra min +EV % for WNBA (smaller sample / higher variance). */
export const WNBA_MIN_EV_BUMP_PCT = 0.5

/** When raw EV gap is below this, sport market weights break ties. */
export const SPORT_PICK_EV_TIE_GAP_PCT = 2

export type PlusEvPickOptionsLike = {
  minBooks?: number
  minEvPct?: number
  maxEvPct?: number
  marketKeys?: SportMarketKey[]
}

export type SportPickLike = {
  marketKey: SportMarketKey
  edgePct: number
  pickName: string
  pickPrice: number
  bookCount?: number
}

export type SportAnalysisProfile = {
  marketKeys: SportMarketKey[]
  marketWeight: Record<SportMarketKey, number>
  preferUnderdogMl?: boolean
  preferDrawMl?: boolean
}

function normalizeSportKey(sportKey: string): string {
  return String(sportKey || '').trim().toLowerCase()
}

function isDrawOutcome(name: string): boolean {
  const n = String(name || '').trim().toLowerCase()
  return n === 'draw' || n === 'tie'
}

function isMlUnderdog(pick: SportPickLike): boolean {
  return pick.marketKey === 'h2h' && Number(pick.pickPrice) > 0
}

const SPREAD_HEAVY: SportAnalysisProfile = {
  marketKeys: ['h2h', 'spreads', 'totals'],
  marketWeight: { spreads: 12, totals: 10, h2h: 6 },
}

const ML_HEAVY: SportAnalysisProfile = {
  marketKeys: ['h2h', 'spreads', 'totals'],
  marketWeight: { h2h: 12, spreads: 8, totals: 7 },
  preferUnderdogMl: true,
}

const SOCCER_PROFILE: SportAnalysisProfile = {
  marketKeys: ['h2h', 'spreads', 'totals'],
  marketWeight: { h2h: 9, spreads: 10, totals: 9 },
  preferDrawMl: true,
}

/** Per-sport scan + ranking preferences (Ryan sport-by-sport spec). */
export function sportAnalysisProfile(sportKey: string): SportAnalysisProfile {
  const sk = normalizeSportKey(sportKey)

  if (sk.startsWith('americanfootball')) return { ...SPREAD_HEAVY }
  if (sk === 'basketball_nba' || sk === 'basketball_ncaab') return { ...SPREAD_HEAVY }
  if (sk === 'basketball_wnba') return { ...SPREAD_HEAVY }
  if (sk.startsWith('icehockey')) return { ...SPREAD_HEAVY }
  if (sk.startsWith('soccer')) return { ...SOCCER_PROFILE }
  if (sk.startsWith('baseball')) return { ...ML_HEAVY }
  if (sk.startsWith('mma')) return { ...ML_HEAVY }
  if (sk.startsWith('tennis')) return { ...ML_HEAVY }
  if (sk.startsWith('boxing')) return { ...ML_HEAVY }

  return {
    marketKeys: ['h2h', 'spreads', 'totals'],
    marketWeight: { h2h: 8, spreads: 8, totals: 8 },
  }
}

export function defaultMarketKeysForSport(sportKey: string): SportMarketKey[] {
  return [...sportAnalysisProfile(sportKey).marketKeys]
}

export function effectiveMinEvPct(sportKey: string, baseMinEv: number): number {
  const base = Number(baseMinEv)
  if (!Number.isFinite(base)) return baseMinEv
  if (normalizeSportKey(sportKey) === 'basketball_wnba') {
    return Math.round((base + WNBA_MIN_EV_BUMP_PCT) * 100) / 100
  }
  return base
}

export function resolvePlusEvPickOptions(
  sportKey: string,
  opts: PlusEvPickOptionsLike = {},
): PlusEvPickOptionsLike {
  const profile = sportAnalysisProfile(sportKey)
  const baseMin = opts.minEvPct
  return {
    ...opts,
    marketKeys: opts.marketKeys?.length ? opts.marketKeys : profile.marketKeys,
    minEvPct: baseMin != null ? effectiveMinEvPct(sportKey, baseMin) : opts.minEvPct,
  }
}

function pickSortScore(pick: SportPickLike, profile: SportAnalysisProfile): number {
  const w = profile.marketWeight[pick.marketKey] ?? 5
  let score = pick.edgePct + w * 0.15
  if (profile.preferDrawMl && pick.marketKey === 'h2h' && isDrawOutcome(pick.pickName)) {
    score += 0.5
  }
  if (profile.preferUnderdogMl && isMlUnderdog(pick)) {
    score += 0.4
  }
  return score
}

export function compareSportPicks(a: SportPickLike, b: SportPickLike, sportKey: string): number {
  const edgeGap = b.edgePct - a.edgePct
  if (Math.abs(edgeGap) >= SPORT_PICK_EV_TIE_GAP_PCT) return edgeGap

  const profile = sportAnalysisProfile(sportKey)
  const scoreA = pickSortScore(a, profile)
  const scoreB = pickSortScore(b, profile)
  if (scoreB !== scoreA) return scoreB - scoreA
  if (edgeGap !== 0) return edgeGap
  return (b.bookCount ?? 0) - (a.bookCount ?? 0)
}

export function sortOddsPicksBySport<T extends SportPickLike>(picks: T[], sportKey: string): T[] {
  return [...picks].sort((a, b) => compareSportPicks(a, b, sportKey))
}
