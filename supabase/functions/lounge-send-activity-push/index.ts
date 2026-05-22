import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-lounge-activity-push-secret',
}

function toBase64Url(value: string | null | undefined): string | null {
  if (!value) return null
  return value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

type ActivityEventRow = {
  id: string
  recipient_user_id: string
  actor_user_id: string
  event_type: string
  post_id: string | null
  comment_id: string | null
  created_at: string
}

type ActorProfile = {
  handle: string | null
  display_name: string | null
}

function actorLabel(profile: ActorProfile | null): string {
  const handle = String(profile?.handle || '').trim()
  if (handle) return `@${handle}`
  const name = String(profile?.display_name || '').trim()
  if (name) return name
  return 'Someone'
}

function actionPhrase(eventType: string, commentId: string | null): string {
  switch (eventType) {
    case 'comment_on_post':
      return 'commented on your post'
    case 'reply_to_comment':
      return 'replied to your comment'
    case 'mention_in_post':
      return 'mentioned you in a post'
    case 'mention_in_comment':
      return 'mentioned you in a comment'
    case 'follow':
      return 'followed you'
    case 'repost':
      return commentId ? 'reposted your comment' : 'reposted your post'
    case 'quote_repost':
      return 'quote reposted your post'
    case 'bookmark':
      return commentId ? 'bookmarked your comment' : 'bookmarked your post'
    case 'like':
      return commentId ? 'liked your comment' : 'liked your post'
    default:
      return 'interacted with you'
  }
}

function buildTargetUrl(event: ActivityEventRow, actor: ActorProfile | null): string {
  if (event.event_type === 'follow') {
    const handle = String(actor?.handle || '').trim().replace(/^@/, '').toLowerCase()
    if (handle) return `/?tab=home&u=${encodeURIComponent(handle)}`
    return '/?tab=home&lounge=notifications'
  }
  if (event.post_id) {
    return `/?tab=home&post=${encodeURIComponent(event.post_id)}`
  }
  return '/?tab=home&lounge=notifications'
}

function buildNotification(event: ActivityEventRow, actor: ActorProfile | null): {
  title: string
  body: string
  url: string
} {
  const who = actorLabel(actor)
  const phrase = actionPhrase(event.event_type, event.comment_id)
  return {
    title: 'Edge Lounge',
    body: `${who} ${phrase}`,
    url: buildTargetUrl(event, actor),
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
    const pushSecret = Deno.env.get('LOUNGE_ACTIVITY_PUSH_SECRET')

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
    }
    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error('Missing WEB_PUSH_PUBLIC_KEY or WEB_PUSH_PRIVATE_KEY.')
    }
    if (!pushSecret) {
      throw new Error('Missing LOUNGE_ACTIVITY_PUSH_SECRET.')
    }

    const headerSecret = req.headers.get('x-lounge-activity-push-secret') || ''
    if (headerSecret !== pushSecret) {
      return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => ({}))
    const activityEventId =
      typeof body?.activityEventId === 'string'
        ? body.activityEventId.trim()
        : typeof body?.activity_event_id === 'string'
          ? body.activity_event_id.trim()
          : ''
    if (!activityEventId) {
      return new Response(JSON.stringify({ error: 'Missing activityEventId.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey)

    const { data: eventRow, error: eventError } = await admin
      .from('activity_events')
      .select('id, recipient_user_id, actor_user_id, event_type, post_id, comment_id, created_at')
      .eq('id', activityEventId)
      .maybeSingle()

    if (eventError) throw eventError
    if (!eventRow) {
      return new Response(JSON.stringify({ error: 'Activity event not found.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const event = eventRow as ActivityEventRow

    const { data: actorProfile, error: actorError } = await admin
      .from('profiles')
      .select('handle, display_name')
      .eq('user_id', event.actor_user_id)
      .maybeSingle()

    if (actorError) throw actorError

    const notification = buildNotification(event, (actorProfile as ActorProfile | null) || null)

    const { data: subscriptions, error: subError } = await admin
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', event.recipient_user_id)

    if (subError) throw subError
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          sent: 0,
          failed: 0,
          removed: 0,
          message: 'No push subscriptions for recipient.',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

    let sent = 0
    let failed = 0
    let removed = 0

    for (const sub of subscriptions) {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: toBase64Url(sub.p256dh),
          auth: toBase64Url(sub.auth),
        },
      }
      try {
        await webpush.sendNotification(
          subscription as { endpoint: string; keys: { p256dh: string; auth: string } },
          JSON.stringify(notification),
        )
        sent += 1
      } catch (error) {
        failed += 1
        const statusCode = (error as { statusCode?: number })?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          const { error: deleteError } = await admin
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id)
            .eq('user_id', event.recipient_user_id)
          if (!deleteError) removed += 1
        }
      }
    }

    return new Response(JSON.stringify({ sent, failed, removed }), {
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
