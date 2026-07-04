/**
 * Background odds poller — edge alerts + morning Coffee & Covers batch.
 * Body: { slug, action: 'poll_edges' | 'daily_slates', dryRun?: boolean, force?: boolean }
 */
import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { adminOpsCorsHeaders, adminOpsJson, requireAdminUser } from '../_shared/adminAuth.ts'
import {
  countPublishedKindToday,
  fetchActiveSportKeys,
  formatPtMinuteAsClock,
  loadSportOddsContext,
  loadTodayCalendarRows,
  morningSlateShouldRunNow,
  ptDayStartIso,
  tryPublishCoffeeAndCovers,
  tryPublishEdgeAlert,
  tryPublishSlateCheckIn,
  type OddsCfgRow,
} from '../_shared/loungeBotOddsRun.ts'
import { DEFAULT_MIN_EV_PCT } from '../_shared/loungeBotOddsCaption.ts'

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: adminOpsCorsHeaders })
  if (req.method !== 'POST') return adminOpsJson(405, { error: 'POST required.' })

  try {
    const admin = await authorize(req)
    const body = await req.json().catch(() => ({}))
    const slug = String(body?.slug || 'sports-odds').trim()
    const action = String(body?.action || 'poll_edges').trim()
    const dryRun = body?.dryRun === true
    const force = body?.force === true

    if (!['poll_edges', 'daily_slates'].includes(action)) {
      return adminOpsJson(400, { error: 'action must be poll_edges or daily_slates.' })
    }

    const { data: bot, error: botErr } = await admin
      .from('lounge_bot_accounts')
      .select('user_id, slug, run_state, pipeline, category_pills_default')
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
      return adminOpsJson(200, { ok: true, skipped: 'no_calendar_today', slug, action })
    }

    const { data: oddsCfgRaw } = await admin
      .from('lounge_bot_odds_config')
      .select('*')
      .eq('bot_user_id', bot.user_id)
      .maybeSingle()

    const oddsCfg = (oddsCfgRaw || {}) as OddsCfgRow
    const regions = oddsCfg.regions || ['us']
    const markets = oddsCfg.markets || ['h2h', 'spreads']
    const minEdge = Number(oddsCfg.min_edge_pct) ?? DEFAULT_MIN_EV_PCT
    const maxEdgeAlerts = Number(oddsCfg.max_edge_alerts_per_day) || 6
    const maxMorningPosts = Number(oddsCfg.max_slate_posts_per_day) || 10
    const morningEnabled = oddsCfg.daily_slate_enabled !== false
    const coffeeCoversEnabled = oddsCfg.coffee_covers_enabled !== false

    if (action === 'daily_slates' && !dryRun) {
      const gate = morningSlateShouldRunNow(bot.user_id, { force })
      if (!gate.shouldRun) {
        return adminOpsJson(200, {
          ok: true,
          skipped: gate.reason,
          slug,
          action,
          scheduledPt: gate.scheduledMinute != null
            ? formatPtMinuteAsClock(gate.scheduledMinute)
            : null,
          nowMinute: gate.nowMinute,
        })
      }
    }

    const morningGate = action === 'daily_slates'
      ? morningSlateShouldRunNow(bot.user_id, { force: false })
      : null

    const dayStart = ptDayStartIso()
    let edgeCount = await countPublishedKindToday(admin, bot.user_id, 'edge', dayStart)
    const morningPostKind = coffeeCoversEnabled ? 'coffee_covers' : 'slate'
    let morningCount = await countPublishedKindToday(admin, bot.user_id, morningPostKind, dayStart)

    const activeSports = await fetchActiveSportKeys()
    let publishedEdges = 0
    let publishedCoffeeCovers = 0
    let publishedSlates = 0
    let requestsRemaining: string | null = null
    const details: Record<string, unknown>[] = []

    for (const row of calendarRows) {
      const sportKey = row.odds_sport_keys?.[0]
      if (!sportKey) continue
      if (!activeSports.has(sportKey)) {
        details.push({ calendarSlug: row.slug, sportKey, skipped: 'sport_not_active' })
        continue
      }

      const calendarPick = {
        calendarSlug: row.slug,
        categoryLabel: String(row.caption_prefix || row.label_short || '').trim(),
      }

      try {
        const ctx = await loadSportOddsContext(
          admin,
          bot.user_id,
          sportKey,
          calendarPick,
          regions,
          markets,
          dryRun,
        )
        requestsRemaining = ctx.requestsRemaining

        if (action === 'poll_edges') {
          if (edgeCount >= maxEdgeAlerts) {
            details.push({ calendarSlug: row.slug, skipped: 'edge_cap' })
            continue
          }
          const edgeResult = await tryPublishEdgeAlert(admin, bot, ctx, minEdge, dayStart, dryRun)
          if (edgeResult.published) {
            publishedEdges += 1
            edgeCount += 1
          }
          details.push({
            calendarSlug: row.slug,
            sportKey,
            publishedEdge: edgeResult.published,
            edge: edgeResult.pick?.edgePct ?? null,
            skipped: edgeResult.skipped,
          })
        } else if (morningEnabled) {
          if (morningCount >= maxMorningPosts) {
            details.push({ calendarSlug: row.slug, skipped: 'morning_cap' })
            continue
          }

          if (coffeeCoversEnabled) {
            const coffeeResult = await tryPublishCoffeeAndCovers(admin, bot, ctx, dayStart, dryRun)
            if (coffeeResult.published) {
              publishedCoffeeCovers += 1
              morningCount += 1
            }
            details.push({
              calendarSlug: row.slug,
              sportKey,
              publishedCoffeeCovers: coffeeResult.published,
              gamesToday: coffeeResult.gamesToday ?? null,
              coverCount: coffeeResult.coverCount ?? null,
              mlCount: coffeeResult.mlCount ?? null,
              hasCovers: coffeeResult.hasCovers ?? null,
              skipped: coffeeResult.skipped,
            })
          } else {
            const slateResult = await tryPublishSlateCheckIn(admin, bot, ctx, dayStart, dryRun)
            if (slateResult.published) {
              publishedSlates += 1
              morningCount += 1
            }
            details.push({
              calendarSlug: row.slug,
              sportKey,
              publishedSlate: slateResult.published,
              gamesToday: slateResult.gamesToday ?? null,
              skipped: slateResult.skipped,
            })
          }
        }
      } catch (err) {
        details.push({
          calendarSlug: row.slug,
          sportKey,
          error: err instanceof Error ? err.message : 'fetch failed',
        })
      }
    }

    const publishedMorning = publishedCoffeeCovers + publishedSlates

    if (!dryRun && (publishedEdges > 0 || publishedMorning > 0)) {
      await admin.from('lounge_bot_accounts').update({
        last_poll_at: new Date().toISOString(),
        last_publish_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('user_id', bot.user_id)
    } else if (!dryRun) {
      await admin.from('lounge_bot_accounts').update({
        last_poll_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('user_id', bot.user_id)
    }

    return adminOpsJson(200, {
      ok: true,
      slug,
      action,
      dryRun,
      coffeeCoversEnabled,
      sportsChecked: details.length,
      publishedEdges,
      publishedCoffeeCovers,
      publishedSlates,
      publishedMorning,
      requestsRemaining,
      scheduledPt: morningGate?.scheduledMinute != null
        ? formatPtMinuteAsClock(morningGate.scheduledMinute)
        : null,
      wouldRunMorningSlates: morningGate?.shouldRun ?? null,
      details,
    })
  } catch (err) {
    if (err instanceof Response) return err
    return adminOpsJson(500, { error: err instanceof Error ? err.message : 'Unexpected error' })
  }
})
