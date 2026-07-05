/**
 * Per-alert audience routing for Scott Share (freemium feed gating).
 */

export type AlertAudience = 'all' | 'subscribers'

export type OddsAlertAudienceKey =
  | 'coffee_covers'
  | 'edge'
  | 'line_movement'
  | 'in_game_edge'
  | 'period_report'
  | 'best_bet_hour'
  | 'arb_watch'
  | 'sharp_report'
  | 'value_bet_radar'
  | 'starter_spotlight'
  | 'confirmed_starters'
  | 'injury_impact'
  | 'rest_travel_edge'
  | 'fade_the_public'

export const ODDS_ALERT_AUDIENCE_KEYS: OddsAlertAudienceKey[] = [
  'coffee_covers',
  'edge',
  'line_movement',
  'in_game_edge',
  'period_report',
  'best_bet_hour',
  'arb_watch',
  'sharp_report',
  'value_bet_radar',
  'starter_spotlight',
  'confirmed_starters',
  'injury_impact',
  'rest_travel_edge',
  'fade_the_public',
]

export const DEFAULT_ALERT_AUDIENCE: Record<OddsAlertAudienceKey, AlertAudience> = {
  coffee_covers: 'all',
  edge: 'subscribers',
  line_movement: 'subscribers',
  in_game_edge: 'subscribers',
  period_report: 'subscribers',
  best_bet_hour: 'subscribers',
  arb_watch: 'subscribers',
  sharp_report: 'subscribers',
  value_bet_radar: 'all',
  starter_spotlight: 'subscribers',
  confirmed_starters: 'subscribers',
  injury_impact: 'subscribers',
  rest_travel_edge: 'subscribers',
  fade_the_public: 'subscribers',
}

export const ALERT_AUDIENCE_LABELS: Record<OddsAlertAudienceKey, string> = {
  coffee_covers: 'Coffee & Covers',
  edge: '+EV Edge Alerts',
  line_movement: 'Line Movement',
  in_game_edge: 'In-Game Edge',
  period_report: 'Period / Halftime Report',
  best_bet_hour: 'Best Bet of the Hour',
  arb_watch: 'Arb Watch',
  sharp_report: "Sharpe's Sharp Report",
  value_bet_radar: 'Value Bet Radar',
  starter_spotlight: 'Starter Spotlight',
  confirmed_starters: 'Confirmed Starters',
  injury_impact: 'Injury Impact',
  rest_travel_edge: 'Rest + Travel Advantage',
  fade_the_public: 'Fade the Public',
}

const LINE_KINDS = new Set(['line_movement', 'sharp_move', 'steam', 'rlm'])

/** Map publish_log post_kind to alert_audience config key. */
export function audienceKeyForPostKind(postKind: string): OddsAlertAudienceKey {
  if (LINE_KINDS.has(postKind)) return 'line_movement'
  if (postKind === 'coffee_covers' || postKind === 'slate') return 'coffee_covers'
  if (postKind === 'in_game_edge') return 'in_game_edge'
  if (postKind === 'period_report') return 'period_report'
  if (postKind === 'best_bet_hour') return 'best_bet_hour'
  if (postKind === 'arb_watch') return 'arb_watch'
  if (postKind === 'sharp_report') return 'sharp_report'
  if (postKind === 'value_bet_radar') return 'value_bet_radar'
  if (postKind === 'starter_spotlight') return 'starter_spotlight'
  if (postKind === 'confirmed_starters') return 'confirmed_starters'
  if (postKind === 'injury_impact') return 'injury_impact'
  if (postKind === 'rest_travel_edge') return 'rest_travel_edge'
  if (postKind === 'fade_the_public') return 'fade_the_public'
  return 'edge'
}

export function normalizeAlertAudience(
  raw: Record<string, unknown> | null | undefined,
): Record<OddsAlertAudienceKey, AlertAudience> {
  const out = { ...DEFAULT_ALERT_AUDIENCE }
  if (!raw || typeof raw !== 'object') return out
  for (const key of ODDS_ALERT_AUDIENCE_KEYS) {
    const val = String(raw[key] || '').trim()
    if (val === 'all' || val === 'subscribers') out[key] = val
  }
  return out
}

/** True when the post should be subscriber_only on community_feed_posts. */
export function resolveAlertSubscriberOnly(
  postKind: string,
  alertAudience?: Record<string, unknown> | null,
): boolean {
  const key = audienceKeyForPostKind(postKind)
  const normalized = normalizeAlertAudience(alertAudience)
  return normalized[key] === 'subscribers'
}
