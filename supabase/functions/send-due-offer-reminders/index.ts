import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/** Distinct from legacy rule-based sends (15, 30, …). One row per event for schedule-driven push. */
const ALERT_SCHEDULE_LEAD_KEY = 0

function toBase64Url(value: string | null | undefined): string | null {
  if (!value) return null
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function formatEventDate(iso: string): string {
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return 'soon'
  return dt.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function notificationPayload(ev: {
  casino_name: string | null
  title: string | null
  start_at: string
  alert_preset: string | null
}): { title: string; body: string } {
  const casino = ev.casino_name || 'Offer'
  const title = ev.title || 'Your event'
  if (ev.alert_preset === 'day_9am') {
    return {
      title: `${casino} · Today`,
      body: `${title} (${formatEventDate(ev.start_at)})`,
    }
  }
  return {
    title: `${casino} · Starting soon`,
    body: `${title} at ${formatEventDate(ev.start_at)}`,
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const vapidPublicKey = Deno.env.get('WEB_PUSH_PUBLIC_KEY')
    const vapidPrivateKey = Deno.env.get('WEB_PUSH_PRIVATE_KEY')
    const vapidSubject = Deno.env.get('WEB_PUSH_SUBJECT') || 'mailto:support@lvslotpro.com'
    if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
    if (!vapidPublicKey || !vapidPrivateKey) throw new Error('Missing WEB_PUSH_PUBLIC_KEY or WEB_PUSH_PRIVATE_KEY.')

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const body = await req.json().catch(() => ({}))
    const dryRun = body?.dryRun === true
    const lookaheadMinutes = Number(body?.lookaheadMinutes) > 0 ? Number(body.lookaheadMinutes) : 1
    const now = new Date()
    const upper = new Date(now.getTime() + lookaheadMinutes * 60_000)

    const { data: rules, error: rulesError } = await admin.from('offer_notification_rules').select('user_id').eq('enabled', true)

    if (rulesError) throw rulesError
    const allowedUsers = [...new Set((rules || []).map((r) => r.user_id).filter(Boolean))] as string[]
    if (allowedUsers.length === 0) {
      return new Response(JSON.stringify({ checked: 0, queued: 0, sent: 0, failed: 0, removed: 0, dryRun }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    const { data: candidates, error: candErr } = await admin
      .from('offer_events')
      .select('id, user_id, casino_name, title, start_at, alert_fire_at, alert_preset')
      .in('user_id', allowedUsers)
      .not('alert_fire_at', 'is', null)
      .gte('alert_fire_at', now.toISOString())
      .lt('alert_fire_at', upper.toISOString())
      .order('alert_fire_at', { ascending: true })
      .limit(400)

    if (candErr) throw candErr

    const list = candidates || []
    let checked = list.length
    let queued = 0
    let sent = 0
    let failed = 0
    let removed = 0

    for (const ev of list) {
      const { data: existing } = await admin
        .from('offer_notification_sends')
        .select('id')
        .eq('user_id', ev.user_id)
        .eq('event_id', ev.id)
        .eq('lead_minutes', ALERT_SCHEDULE_LEAD_KEY)
        .maybeSingle()
      if (existing) continue

      queued += 1
      if (dryRun) continue

      const { data: subscriptions, error: subError } = await admin
        .from('push_subscriptions')
        .select('id, endpoint, p256dh, auth')
        .eq('user_id', ev.user_id)
      if (subError) throw subError
      if (!subscriptions || subscriptions.length === 0) {
        await admin.from('offer_notification_sends').insert({
          user_id: ev.user_id,
          event_id: ev.id,
          lead_minutes: ALERT_SCHEDULE_LEAD_KEY,
          send_status: 'no_subscription',
          error_message: 'No push subscriptions found for user.',
        })
        continue
      }

      const { title, body: nBody } = notificationPayload(ev)
      let hadSuccess = false
      let errorSummary = ''
      for (const sub of subscriptions) {
        const subscription = {
          endpoint: sub.endpoint,
          keys: { p256dh: toBase64Url(sub.p256dh), auth: toBase64Url(sub.auth) },
        }
        try {
          await webpush.sendNotification(
            subscription as { endpoint: string; keys: { p256dh: string; auth: string } },
            JSON.stringify({
              title,
              body: nBody,
              url: '/?tab=offers',
            })
          )
          hadSuccess = true
          sent += 1
        } catch (error) {
          failed += 1
          const statusCode = (error as { statusCode?: number })?.statusCode
          const message = (error as { message?: string })?.message || 'Push send failed.'
          errorSummary = message
          if (statusCode === 404 || statusCode === 410) {
            const { error: deleteError } = await admin.from('push_subscriptions').delete().eq('id', sub.id).eq('user_id', ev.user_id)
            if (!deleteError) removed += 1
          }
        }
      }

      await admin.from('offer_notification_sends').insert({
        user_id: ev.user_id,
        event_id: ev.id,
        lead_minutes: ALERT_SCHEDULE_LEAD_KEY,
        send_status: hadSuccess ? 'sent' : 'failed',
        error_message: hadSuccess ? null : errorSummary.slice(0, 400),
      })
    }

    return new Response(JSON.stringify({ checked, queued, sent, failed, removed, dryRun }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
