/**
 * TheRundown live score → period/halftime milestones (replaces wall-clock heuristics when key is set).
 */
import {
  findRundownEventForMatch,
  isRundownEnabled,
  RUNDOWN_LIVE_CACHE_MS,
  type RundownMatchInput,
  type RundownScore,
} from './loungeBotRundownContext.ts'

export type LivePeriodMilestone = {
  key: string
  label: string
  source: 'rundown' | 'elapsed'
}

function normalizeStatus(status: string): string {
  return String(status || '').trim().toUpperCase()
}

function isLiveStatus(status: string): boolean {
  return /IN_PROGRESS|HALFTIME|END_PERIOD|OVERTIME|FIRST_HALF|SECOND_HALF/i.test(status)
}

/** Map Rundown score object → period report milestone (null when not at a milestone). */
export function detectRundownPeriodMilestone(
  sportKey: string,
  score: RundownScore | null | undefined,
): LivePeriodMilestone | null {
  if (!score) return null
  const status = normalizeStatus(score.event_status || '')
  const period = Number(score.game_period)
  const detail = String(score.event_status_detail || '').trim()

  if (sportKey.startsWith('basketball') || sportKey.startsWith('americanfootball')) {
    if (status === 'STATUS_HALFTIME') {
      return { key: 'halftime', label: 'Halftime Report', source: 'rundown' }
    }
    if (status === 'STATUS_END_PERIOD' && period === 2) {
      return { key: 'halftime', label: 'Halftime Report', source: 'rundown' }
    }
  }

  if (sportKey.startsWith('icehockey')) {
    if (status === 'STATUS_END_PERIOD') {
      if (period === 1 || /\b1st\b/i.test(detail)) {
        return { key: 'p1_end', label: 'End of 1st Period', source: 'rundown' }
      }
      if (period === 2 || /\b2nd\b/i.test(detail)) {
        return { key: 'p2_end', label: 'End of 2nd Period', source: 'rundown' }
      }
    }
  }

  if (sportKey.startsWith('baseball')) {
    if (!isLiveStatus(status)) return null
    if (!Number.isFinite(period) || period < 5) return null
    const label = detail && /inning/i.test(detail)
      ? `Mid-Game Update (${detail})`
      : period === 5
      ? 'Mid-Game Update (5th Inning)'
      : `Mid-Game Update (${period}th Inning)`
    return { key: 'inning_5', label, source: 'rundown' }
  }

  return null
}

/** Human-readable live period for in-game edge headers. */
export function formatRundownLivePeriodLabel(
  sportKey: string,
  score: RundownScore | null | undefined,
): string | null {
  if (!score) return null
  const detail = String(score.event_status_detail || '').trim()
  if (detail) return detail

  const status = normalizeStatus(score.event_status || '')
  const period = Number(score.game_period)

  if (status === 'STATUS_HALFTIME') return 'Halftime'
  if (sportKey.startsWith('icehockey') && Number.isFinite(period) && period > 0) {
    return `${period}${period === 1 ? 'st' : period === 2 ? 'nd' : 'rd'} Period`
  }
  if (sportKey.startsWith('baseball') && Number.isFinite(period) && period > 0) {
    return `Inning ${period}`
  }
  if (sportKey.startsWith('basketball') && Number.isFinite(period) && period > 0) {
    return `${period}${period === 1 ? 'st' : period === 2 ? 'nd' : period === 3 ? 'rd' : 'th'} Quarter`
  }
  return null
}

export async function resolveRundownPeriodMilestone(
  input: RundownMatchInput,
): Promise<LivePeriodMilestone | null> {
  if (!isRundownEnabled()) return null
  const event = await findRundownEventForMatch(input, { maxCacheMs: RUNDOWN_LIVE_CACHE_MS })
  return detectRundownPeriodMilestone(input.sportKey, event?.score)
}

export async function resolveRundownLivePeriodLabel(
  input: RundownMatchInput,
): Promise<string | null> {
  if (!isRundownEnabled()) return null
  const event = await findRundownEventForMatch(input, { maxCacheMs: RUNDOWN_LIVE_CACHE_MS })
  return formatRundownLivePeriodLabel(input.sportKey, event?.score)
}
