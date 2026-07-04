/**
 * Shared odds fetch, slate, and edge-alert publish logic.
 */
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import {
  buildOddsEdgeAlertCaption,
  buildOddsSlateCaption,
  DEFAULT_MAX_EV_PCT,
  DEFAULT_MIN_BOOKS,
  DEFAULT_MIN_EV_PCT,
  DEFAULT_ODDS_WINDOW_HOURS,
  edgeAlertDedupeKey,
  filterOddsEventsByWindow,
  filterOddsEventsForPtCalendarDay,
  pickBestOddsCandidate,
  slateDedupeKey,
  type OddsPick,
} from './loungeBotOddsCaption.ts'
import { publishLoungeBotPost } from './loungeBotPublish.ts'

const ODDS_BASE = 'https://api.the-odds-api.com/v4'

export type CalendarRow = {
  slug: string
  label_short: string
  caption_prefix: string | null
  odds_sport_keys: string[]
}

export type OddsBotRow = {
  user_id: string
  slug: string
  run_state: string
  category_pills_default: string[] | null
}

export type OddsCfgRow = {
  regions: string[] | null
  markets: string[] | null
  min_edge_pct: number | null
  max_edge_alerts_per_day: number | null
  max_slate_posts_per_day: number | null
  daily_slate_enabled: boolean | null
}

export function oddsApiKey(): string {
  return String(Deno.env.get('THE_ODDS_API_KEY') || '').trim()
}

export function ptTodayDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function ptDayStartIso(): string {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = fmt.formatToParts(new Date())
  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const d = parts.find((p) => p.type === 'day')?.value
  return new Date(`${y}-${m}-${d}T00:00:00-07:00`).toISOString()
}

const MORNING_SLATE_START_MIN_PT = 7 * 60
const MORNING_SLATE_END_MIN_PT = 10 * 60

function hashString(input: string): number {
  let h = 0
  for (let i = 0; i < input.length; i++) {
    h = (Math.imul(31, h) + input.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

/** Minutes since midnight in America/Los_Angeles (0-1439). */
export function ptMinutesSinceMidnightPt(now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return hour * 60 + minute
}

/** Stable random minute between 7:00 and 9:59am PT for this bot + calendar day. */
export function morningSlateScheduledMinutePt(botUserId: string, ptDate = ptTodayDate()): number {
  const span = MORNING_SLATE_END_MIN_PT - MORNING_SLATE_START_MIN_PT
  return MORNING_SLATE_START_MIN_PT + (hashString(`${botUserId}:${ptDate}`) % span)
}

export function formatPtMinuteAsClock(totalMinutes: number): string {
  const h24 = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  const h12 = h24 % 12 || 12
  const suffix = h24 >= 12 ? 'pm' : 'am'
  return m === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`
}

export function morningSlateShouldRunNow(
  botUserId: string,
  opts: { force?: boolean } = {},
): { shouldRun: boolean; reason?: string; scheduledMinute?: number; nowMinute?: number } {
  const nowMinute = ptMinutesSinceMidnightPt()
  const scheduledMinute = morningSlateScheduledMinutePt(botUserId)

  if (opts.force) {
    return { shouldRun: true, scheduledMinute, nowMinute }
  }
  if (nowMinute < MORNING_SLATE_START_MIN_PT || nowMinute >= MORNING_SLATE_END_MIN_PT) {
    return { shouldRun: false, reason: 'outside_morning_window', scheduledMinute, nowMinute }
  }
  if (nowMinute < scheduledMinute) {
    return { shouldRun: false, reason: 'before_scheduled_time', scheduledMinute, nowMinute }
  }
  return { shouldRun: true, scheduledMinute, nowMinute }
}

export async function fetchActiveSportKeys(): Promise<Set<string>> {
  const key = oddsApiKey()
  if (!key) throw new Error('THE_ODDS_API_KEY not set on Edge.')
  const res = await fetch(`${ODDS_BASE}/sports/?apiKey=${encodeURIComponent(key)}`)
  if (!res.ok) throw new Error(`Odds API sports list ${res.status}`)
  const sports = await res.json()
  const active = new Set<string>()
  if (Array.isArray(sports)) {
    for (const row of sports) {
      if (row?.active === true && typeof row.key === 'string') active.add(row.key)
    }
  }
  return active
}

export async function fetchSportOdds(sport: string, regions: string[], markets: string[]) {
  const key = oddsApiKey()
  if (!key) throw new Error('THE_ODDS_API_KEY not set on Edge.')
  const qs = new URLSearchParams({
    apiKey: key,
    regions: regions.join(','),
    markets: markets.join(','),
    oddsFormat: 'american',
  })
  const res = await fetch(`${ODDS_BASE}/sports/${sport}/odds?${qs}`)
  if (!res.ok) throw new Error(`Odds API ${sport} ${res.status}`)
  return { events: await res.json(), remaining: res.headers.get('x-requests-remaining') }
}

export async function loadTodayCalendarRows(admin: SupabaseClient): Promise<CalendarRow[]> {
  const today = ptTodayDate()
  const { data, error } = await admin
    .from('lounge_sports_betting_calendar')
    .select('slug, label_short, caption_prefix, odds_sport_keys')
    .eq('enabled', true)
    .lte('start_date', today)
    .gte('end_date', today)
    .order('priority', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []) as CalendarRow[]
}

export function resolveCalendarSelection(
  rows: CalendarRow[],
  sportKey: string,
  calendarSlug: string,
): { ok: true; categoryLabel: string; calendarSlug: string } | { ok: false; error: string } {
  const matches = rows.filter((row) => (row.odds_sport_keys || []).includes(sportKey))
  if (!matches.length) {
    return { ok: false, error: 'Selected sport is not on today\'s major events calendar.' }
  }

  let row = matches[0]
  if (calendarSlug) {
    const picked = matches.find((r) => r.slug === calendarSlug)
    if (!picked) {
      return { ok: false, error: 'Calendar selection does not match the sport key.' }
    }
    row = picked
  }

  return {
    ok: true,
    calendarSlug: row.slug,
    categoryLabel: String(row.caption_prefix || row.label_short || '').trim(),
  }
}

export async function countPublishedKindToday(
  admin: SupabaseClient,
  botUserId: string,
  postKind: 'edge' | 'slate',
  dayStart: string,
): Promise<number> {
  const { count } = await admin
    .from('lounge_bot_publish_log')
    .select('id', { count: 'exact', head: true })
    .eq('bot_user_id', botUserId)
    .eq('status', 'published')
    .eq('post_kind', postKind)
    .gte('created_at', dayStart)
  return count || 0
}

export async function hasDedupePublishedToday(
  admin: SupabaseClient,
  botUserId: string,
  dedupeKey: string,
  dayStart: string,
): Promise<boolean> {
  const { data } = await admin
    .from('lounge_bot_publish_log')
    .select('id')
    .eq('bot_user_id', botUserId)
    .eq('status', 'published')
    .eq('dedupe_key', dedupeKey)
    .gte('created_at', dayStart)
    .maybeSingle()
  return Boolean(data?.id)
}

export type SportOddsContext = {
  sportKey: string
  calendarSlug: string
  categoryLabel: string
  upcoming: ReturnType<typeof filterOddsEventsByWindow>
  eventsInWindow: number
  requestsRemaining: string | null
}

export async function loadSportOddsContext(
  admin: SupabaseClient,
  botUserId: string,
  sportKey: string,
  calendarPick: { calendarSlug: string; categoryLabel: string },
  regions: string[],
  markets: string[],
  dryRun: boolean,
): Promise<SportOddsContext> {
  const { events, remaining } = await fetchSportOdds(sportKey, regions, markets)
  const raw = Array.isArray(events) ? events : []
  const inWindow = filterOddsEventsByWindow(raw, DEFAULT_ODDS_WINDOW_HOURS)
  const upcoming = filterOddsEventsForPtCalendarDay(inWindow, ptTodayDate())

  if (!dryRun) {
    await admin.from('lounge_odds_snapshots').insert({
      bot_user_id: botUserId,
      sport: sportKey,
      payload: {
        calendarSlug: calendarPick.calendarSlug,
        categoryLabel: calendarPick.categoryLabel,
        rawCount: raw.length,
        windowCount: inWindow.length,
        todayCount: upcoming.length,
        ptDate: ptTodayDate(),
        events: upcoming,
      },
    })
  }

  return {
    sportKey,
    calendarSlug: calendarPick.calendarSlug,
    categoryLabel: calendarPick.categoryLabel,
    upcoming,
    eventsInWindow: upcoming.length,
    requestsRemaining: remaining,
  }
}

export async function tryPublishEdgeAlert(
  admin: SupabaseClient,
  bot: OddsBotRow,
  ctx: SportOddsContext,
  minEdge: number,
  dayStart: string,
  dryRun: boolean,
): Promise<{ published: boolean; pick: OddsPick | null; skipped?: string }> {
  const pick = pickBestOddsCandidate(ctx.upcoming, ctx.sportKey, {
    minBooks: DEFAULT_MIN_BOOKS,
    minEvPct: minEdge,
    maxEvPct: DEFAULT_MAX_EV_PCT,
  })

  if (!pick || pick.edgePct < minEdge) {
    return { published: false, pick: pick && pick.edgePct < minEdge ? pick : null }
  }

  const dedupeKey = edgeAlertDedupeKey(pick, ptTodayDate())
  if (!dryRun && await hasDedupePublishedToday(admin, bot.user_id, dedupeKey, dayStart)) {
    return { published: false, pick, skipped: 'edge_already_posted' }
  }

  const caption = buildOddsEdgeAlertCaption(pick, { categoryLabel: ctx.categoryLabel })
  if (dryRun) return { published: false, pick }

  const pills = bot.category_pills_default?.length ? bot.category_pills_default : ['sports']
  const result = await publishLoungeBotPost(admin, {
    botUserId: bot.user_id,
    caption,
    categoryPills: pills,
  })

  if (result.postId) {
    await admin.from('lounge_bot_publish_log').insert({
      bot_user_id: bot.user_id,
      post_id: result.postId,
      caption,
      score: pick.edgePct,
      status: 'published',
      post_kind: 'edge',
      dedupe_key: dedupeKey,
    })
    return { published: true, pick }
  }

  await admin.from('lounge_bot_publish_log').insert({
    bot_user_id: bot.user_id,
    caption,
    score: pick.edgePct,
    status: 'failed',
    post_kind: 'edge',
    dedupe_key: dedupeKey,
    error_message: result.error?.slice(0, 400),
  })
  return { published: false, pick, skipped: 'publish_failed' }
}

export async function tryPublishSlateCheckIn(
  admin: SupabaseClient,
  bot: OddsBotRow,
  ctx: SportOddsContext,
  dayStart: string,
  dryRun: boolean,
): Promise<{ published: boolean; skipped?: string; gamesToday?: number }> {
  if (ctx.eventsInWindow <= 0) {
    return { published: false, skipped: 'no_games_today', gamesToday: 0 }
  }

  const dedupeKey = slateDedupeKey(ctx.calendarSlug, ptTodayDate())
  if (!dryRun && await hasDedupePublishedToday(admin, bot.user_id, dedupeKey, dayStart)) {
    return { published: false, skipped: 'slate_already_posted', gamesToday: ctx.eventsInWindow }
  }

  const caption = buildOddsSlateCaption({
    categoryLabel: ctx.categoryLabel,
    events: ctx.upcoming,
  })

  if (dryRun) return { published: false, gamesToday: ctx.eventsInWindow }

  const pills = bot.category_pills_default?.length ? bot.category_pills_default : ['sports']
  const result = await publishLoungeBotPost(admin, {
    botUserId: bot.user_id,
    caption,
    categoryPills: pills,
  })

  if (result.postId) {
    await admin.from('lounge_bot_publish_log').insert({
      bot_user_id: bot.user_id,
      post_id: result.postId,
      caption,
      score: null,
      status: 'published',
      post_kind: 'slate',
      dedupe_key: dedupeKey,
    })
    return { published: true }
  }

  await admin.from('lounge_bot_publish_log').insert({
    bot_user_id: bot.user_id,
    caption,
    status: 'failed',
    post_kind: 'slate',
    dedupe_key: dedupeKey,
    error_message: result.error?.slice(0, 400),
  })
  return { published: false, skipped: 'publish_failed' }
}
