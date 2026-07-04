/**
 * Sports odds bot — fetch The Odds API, pick, auto-publish.
 * Body: { "slug": "sports-odds", "sportKey": "soccer_fifa_world_cup", "calendarSlug": "fifa-world-cup-2026", "dryRun": false }
 */
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { adminOpsCorsHeaders, adminOpsJson, requireAdminUser } from '../_shared/adminAuth.ts'
import {
  buildOddsPickCaption,
  DEFAULT_MAX_EDGE_PCT,
  DEFAULT_MIN_BOOKS,
  DEFAULT_ODDS_WINDOW_HOURS,
  filterOddsEventsByWindow,
  oddsExternalKey,
  pickBestOddsCandidate,
  type OddsPick,
} from '../_shared/loungeBotOddsCaption.ts'
import { publishLoungeBotPost } from '../_shared/loungeBotPublish.ts'

const ODDS_BASE = 'https://api.the-odds-api.com/v4'

type CalendarRow = {
  slug: string
  label_short: string
  caption_prefix: string | null
  odds_sport_keys: string[]
}

async function authorize(req: Request): Promise<SupabaseClient> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  if (!supabaseUrl || !serviceRoleKey) throw adminOpsJson(503, { error: 'Missing env.' })

  const authHeader = req.headers.get('Authorization') || ''
  if (authHeader.replace(/^Bearer\s+/i, '').trim() === serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey)
  }
  await requireAdminUser(req)
  return createClient(supabaseUrl, serviceRoleKey)
}

function oddsKey(): string {
  return String(Deno.env.get('THE_ODDS_API_KEY') || '').trim()
}

function ptTodayDate(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

async function fetchActiveSportKeys(): Promise<Set<string>> {
  const key = oddsKey()
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

async function fetchSportOdds(sport: string, regions: string[], markets: string[]) {
  const key = oddsKey()
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

async function loadTodayCalendarRows(admin: SupabaseClient): Promise<CalendarRow[]> {
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

function resolveCalendarSelection(
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

function ptDayStartIso(): string {
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: adminOpsCorsHeaders })
  if (req.method !== 'POST') return adminOpsJson(405, { error: 'POST required.' })

  try {
    const admin = await authorize(req)
    const body = await req.json().catch(() => ({}))
    const slug = String(body?.slug || 'sports-odds').trim()
    const dryRun = body?.dryRun === true
    const sportKey = String(body?.sportKey || '').trim()
    const calendarSlug = String(body?.calendarSlug || '').trim()

    if (!sportKey) {
      return adminOpsJson(400, { error: 'sportKey required. Pick today\'s sport in the bot portal.' })
    }

    const { data: bot, error: botErr } = await admin
      .from('lounge_bot_accounts')
      .select('user_id, slug, run_state, pipeline, category_pills_default, max_posts_per_day, config')
      .eq('slug', slug)
      .maybeSingle()

    if (botErr) return adminOpsJson(500, { error: botErr.message })
    if (!bot?.user_id) return adminOpsJson(404, { error: 'Odds bot not configured.' })
    if (bot.pipeline !== 'odds_api') return adminOpsJson(400, { error: 'Not an odds_api bot.' })
    if (!dryRun && bot.run_state !== 'running') {
      return adminOpsJson(200, { ok: true, skipped: bot.run_state, slug })
    }

    const calendarRows = await loadTodayCalendarRows(admin)
    if (!calendarRows.length) {
      return adminOpsJson(200, {
        ok: true,
        skipped: 'no_calendar_today',
        slug,
        message: 'No major events on the betting calendar for today.',
      })
    }

    const calendarPick = resolveCalendarSelection(calendarRows, sportKey, calendarSlug)
    if (!calendarPick.ok) {
      return adminOpsJson(400, { error: calendarPick.error })
    }

    const activeSports = await fetchActiveSportKeys()
    if (!activeSports.has(sportKey)) {
      return adminOpsJson(200, {
        ok: true,
        skipped: 'sport_not_active',
        slug,
        sportKey,
        calendarSlug: calendarPick.calendarSlug,
        categoryLabel: calendarPick.categoryLabel,
      })
    }

    const { data: oddsCfg } = await admin
      .from('lounge_bot_odds_config')
      .select('*')
      .eq('bot_user_id', bot.user_id)
      .maybeSingle()

    const regions = (oddsCfg?.regions as string[]) || ['us']
    const markets = (oddsCfg?.markets as string[]) || ['h2h', 'spreads']
    const minEdge = Number(oddsCfg?.min_edge_pct) || 4
    const maxPicks = Number(oddsCfg?.max_picks_per_run) || 1

    const dayStart = ptDayStartIso()
    const { count: publishedToday } = await admin
      .from('lounge_bot_publish_log')
      .select('id', { count: 'exact', head: true })
      .eq('bot_user_id', bot.user_id)
      .eq('status', 'published')
      .gte('created_at', dayStart)

    const cap = Number(bot.max_posts_per_day) || 2
    const room = Math.max(0, cap - (publishedToday || 0))
    if (!dryRun && room <= 0) {
      return adminOpsJson(200, { ok: true, skipped: 'daily_cap', slug, publishedToday })
    }

    const { events, remaining: requestsRemaining } = await fetchSportOdds(sportKey, regions, markets)
    const raw = Array.isArray(events) ? events : []
    const upcoming = filterOddsEventsByWindow(raw, DEFAULT_ODDS_WINDOW_HOURS)
    const eventsInWindow = upcoming.length

    if (!dryRun) {
      await admin.from('lounge_odds_snapshots').insert({
        bot_user_id: bot.user_id,
        sport: sportKey,
        payload: {
          calendarSlug: calendarPick.calendarSlug,
          categoryLabel: calendarPick.categoryLabel,
          rawCount: raw.length,
          windowCount: upcoming.length,
          events: upcoming,
        },
      })
    }

    const pick = pickBestOddsCandidate(upcoming, sportKey, {
      minBooks: DEFAULT_MIN_BOOKS,
      maxEdgePct: DEFAULT_MAX_EDGE_PCT,
    })

    const candidates: OddsPick[] = pick && pick.edgePct >= minEdge ? [pick] : []

    if (!candidates.length && !dryRun) {
      return adminOpsJson(200, {
        ok: true,
        skipped: eventsInWindow > 0 ? 'no_edge_picks' : 'no_upcoming_games',
        slug,
        sportKey,
        calendarSlug: calendarPick.calendarSlug,
        categoryLabel: calendarPick.categoryLabel,
        eventsInWindow,
        windowHours: DEFAULT_ODDS_WINDOW_HOURS,
        requestsRemaining,
      })
    }

    const toPublish = candidates.slice(0, dryRun ? 1 : Math.min(maxPicks, room))
    const captionOpts = { categoryLabel: calendarPick.categoryLabel }

    let published = 0
    for (const p of toPublish) {
      const caption = buildOddsPickCaption(p, captionOpts)
      if (dryRun) continue

      const { data: dupe } = await admin
        .from('lounge_bot_publish_log')
        .select('id')
        .eq('bot_user_id', bot.user_id)
        .eq('caption', caption)
        .gte('created_at', dayStart)
        .maybeSingle()
      if (dupe?.id) continue

      const pills = bot.category_pills_default?.length ? bot.category_pills_default : ['sports']
      const result = await publishLoungeBotPost(admin, {
        botUserId: bot.user_id,
        caption,
        categoryPills: pills,
      })

      if (result.postId) {
        published += 1
        await admin.from('lounge_bot_publish_log').insert({
          bot_user_id: bot.user_id,
          post_id: result.postId,
          caption,
          score: p.edgePct,
          status: 'published',
        })
      } else {
        await admin.from('lounge_bot_publish_log').insert({
          bot_user_id: bot.user_id,
          caption,
          score: p.edgePct,
          status: 'failed',
          error_message: result.error?.slice(0, 400),
        })
      }
    }

    if (!dryRun) {
      await admin.from('lounge_bot_accounts').update({
        last_poll_at: new Date().toISOString(),
        last_publish_at: published > 0 ? new Date().toISOString() : undefined,
        updated_at: new Date().toISOString(),
      }).eq('user_id', bot.user_id)
    }

    return adminOpsJson(200, {
      ok: true,
      slug,
      dryRun,
      sportKey,
      calendarSlug: calendarPick.calendarSlug,
      categoryLabel: calendarPick.categoryLabel,
      eventsInWindow,
      windowHours: DEFAULT_ODDS_WINDOW_HOURS,
      candidateCount: candidates.length,
      published,
      requestsRemaining,
      topCandidates: toPublish.map((p) => ({
        edge: p.edgePct,
        commenceTime: p.commenceTime,
        books: p.bookCount,
        caption: buildOddsPickCaption(p, captionOpts).slice(0, 120),
      })),
    })
  } catch (err) {
    if (err instanceof Response) return err
    return adminOpsJson(500, { error: err instanceof Error ? err.message : 'Unexpected error' })
  }
})
