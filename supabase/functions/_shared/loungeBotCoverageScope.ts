/**
 * Scott Sharpe coverage scope — priority tiers for calendar sports and alert tie-breaks.
 *
 * Tier 1 (cover heavily): NFL, NBA, MLB, NCAAF, top European soccer, World Cup, NHL
 * Tier 2 (medium): Grand Slam tennis, PGA majors, UFC/MMA, WNBA, NCAA basketball
 * Tier 3 (opportunistic): Olympics, F1, boxing, esports
 *
 * Rules:
 * - Prefer higher coverage rank when picking across sports.
 * - Lower tier wins only on exceptional +EV (default +2% gap) or exceptional line movement.
 * - Tournament / marquee calendar rows get an event boost via priority + kind.
 */

export type CoverageTier = 1 | 2 | 3

export const EXCEPTIONAL_EV_GAP_PCT = 2
export const EXCEPTIONAL_MOVEMENT_GAP = 15

/** Minimum rank delta before tier beats movement score without exceptional gap. */
const MOVEMENT_TIER_WEIGHT = 8

export type CalendarCoverageInput = {
  coverage_tier?: number | null
  priority?: number | null
  kind?: string | null
  odds_sport_keys?: string[] | null
}

const TIER1_KEYS = new Set([
  'americanfootball_nfl',
  'americanfootball_ncaaf',
  'basketball_nba',
  'baseball_mlb',
  'icehockey_nhl',
  'soccer_epl',
  'soccer_spain_la_liga',
  'soccer_germany_bundesliga',
  'soccer_italy_serie_a',
  'soccer_france_ligue_one',
  'soccer_uefa_champs_league',
  'soccer_uefa_europa_league',
  'soccer_fifa_world_cup',
])

const TIER2_KEYS = new Set([
  'basketball_wnba',
  'basketball_ncaab',
  'basketball_euroleague',
  'mma_mixed_martial_arts',
  'tennis_atp_wimbledon',
  'tennis_atp_us_open',
  'tennis_atp_french_open',
  'tennis_atp_australian_open',
  'golf_masters_tournament_winner',
  'golf_pga_championship_winner',
  'golf_us_open_winner',
  'golf_the_open_championship_winner',
])

const TIER3_KEYS = new Set([
  'boxing_boxing',
])

function normalizeSportKey(sportKey: string): string {
  return String(sportKey || '').trim().toLowerCase()
}

/** Default tier from The Odds API sport key (prefix / exact match). */
export function resolveSportKeyTier(sportKey: string): CoverageTier {
  const sk = normalizeSportKey(sportKey)
  if (!sk) return 3
  if (TIER1_KEYS.has(sk)) return 1
  if (TIER2_KEYS.has(sk)) return 2
  if (TIER3_KEYS.has(sk)) return 3

  if (sk.startsWith('americanfootball_')) {
    return sk.includes('preseason') ? 2 : 1
  }
  if (sk.startsWith('basketball_')) {
    if (sk === 'basketball_nba') return 1
    if (sk === 'basketball_ncaab') return 2
    return 2
  }
  if (sk.startsWith('baseball_')) return 1
  if (sk.startsWith('icehockey_')) return sk.includes('nhl') ? 1 : 2
  if (sk.startsWith('soccer_')) {
    if (sk.includes('world_cup') || sk.includes('fifa')) return 1
    if (sk.includes('epl') || sk.includes('la_liga') || sk.includes('bundesliga')
      || sk.includes('serie_a') || sk.includes('ligue_one') || sk.includes('uefa')) {
      return 1
    }
    return 2
  }
  if (sk.startsWith('tennis_')) return 2
  if (sk.startsWith('golf_')) return 2
  if (sk.startsWith('mma_')) return 2
  if (sk.startsWith('boxing_')) return 3
  if (sk.startsWith('motorsport_') || sk.startsWith('formula')) return 3
  if (sk.startsWith('esports_')) return 3
  if (sk.includes('olympic')) return 3

  return 3
}

export function resolveCalendarCoverageTier(input?: CalendarCoverageInput | null): CoverageTier {
  const explicit = Number(input?.coverage_tier)
  if (explicit === 1 || explicit === 2 || explicit === 3) return explicit

  const keys = Array.isArray(input?.odds_sport_keys) ? input.odds_sport_keys : []
  if (keys.length) {
    const tiers = keys.map((k) => resolveSportKeyTier(k))
    return Math.min(...tiers) as CoverageTier
  }

  return 2
}

/** Higher = more important for Scott (tier dominates, then calendar priority / event boost). */
export function coverageRankForSport(
  sportKey: string,
  calendarRow?: CalendarCoverageInput | null,
): number {
  const tier = resolveCalendarCoverageTier({
    coverage_tier: calendarRow?.coverage_tier,
    odds_sport_keys: calendarRow?.odds_sport_keys ?? [sportKey],
    kind: calendarRow?.kind,
    priority: calendarRow?.priority,
  })
  const tierBase = (4 - tier) * 100
  const priority = Math.max(0, Math.min(100, Number(calendarRow?.priority) || 0))
  const kind = String(calendarRow?.kind || '').toLowerCase()
  const eventBoost = kind === 'tournament' || kind === 'marquee' ? 25 : 0
  return tierBase + priority + eventBoost
}

export function compareByCoverageThenEv(
  a: { edgePct: number; coverageRank: number; calendarPriority?: number; bookCount?: number },
  b: { edgePct: number; coverageRank: number; calendarPriority?: number; bookCount?: number },
): number {
  const edgeGap = b.edgePct - a.edgePct
  if (Math.abs(edgeGap) >= EXCEPTIONAL_EV_GAP_PCT) return edgeGap

  if (b.coverageRank !== a.coverageRank) return b.coverageRank - a.coverageRank
  if (b.edgePct !== a.edgePct) return b.edgePct - a.edgePct
  const aPri = a.calendarPriority ?? 0
  const bPri = b.calendarPriority ?? 0
  if (bPri !== aPri) return bPri - aPri
  return (b.bookCount ?? 0) - (a.bookCount ?? 0)
}

export function compareMovementWithCoverage(
  a: { movementScore: number; coverageRank: number },
  b: { movementScore: number; coverageRank: number },
): number {
  const moveGap = b.movementScore - a.movementScore
  if (Math.abs(moveGap) >= EXCEPTIONAL_MOVEMENT_GAP) return moveGap

  const tierGap = b.coverageRank - a.coverageRank
  if (Math.abs(tierGap) >= MOVEMENT_TIER_WEIGHT && tierGap !== 0) return tierGap
  if (moveGap !== 0) return moveGap
  return tierGap
}

export type CalendarRowForCoverage = CalendarCoverageInput & {
  slug?: string
  label_short?: string
  caption_prefix?: string | null
  odds_sport_keys?: string[]
  start_date?: string
  end_date?: string
}

export function sortCalendarRowsByCoverage<T extends CalendarRowForCoverage>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const aKey = a.odds_sport_keys?.[0] || ''
    const bKey = b.odds_sport_keys?.[0] || ''
    const aRank = coverageRankForSport(aKey, a)
    const bRank = coverageRankForSport(bKey, b)
    if (bRank !== aRank) return bRank - aRank
    const aLabel = String(a.label_short || a.slug || '')
    const bLabel = String(b.label_short || b.slug || '')
    return aLabel.localeCompare(bLabel)
  })
}

/** @deprecated Use coverageRankForSport — kept for imports that expect a 0–100 popularity scale. */
export function sportPopularityRank(sportKey: string, calendarRow?: CalendarCoverageInput | null): number {
  return coverageRankForSport(sportKey, calendarRow)
}
