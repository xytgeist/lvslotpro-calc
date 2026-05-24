import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

export function createBillingAdmin(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function getUserFromJwt(admin: SupabaseClient, req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.toLowerCase().startsWith('bearer ')) {
    return { error: 'Missing Authorization bearer token.', status: 401 as const }
  }
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()
  const {
    data: { user },
    error,
  } = await admin.auth.getUser(jwt)
  if (error || !user?.id) {
    return { error: 'Invalid or expired session.', status: 401 as const }
  }
  return { user }
}

export async function assertActiveProduct(admin: SupabaseClient, productSlug: string) {
  const { data, error } = await admin
    .from('subscription_products')
    .select('slug, display_name, active')
    .eq('slug', productSlug)
    .maybeSingle()
  if (error) throw new Error(`subscription_products lookup: ${error.message}`)
  if (!data?.active) {
    return { ok: false as const, error: `Product "${productSlug}" is not available yet.`, status: 400 as const }
  }
  return { ok: true as const, product: data }
}

export type StripeSubscriptionPayload = {
  id: string
  customer: string
  status: string
  cancel_at_period_end?: boolean
  current_period_end?: number
  metadata?: Record<string, string>
}

export async function upsertUserSubscriptionFromStripe(
  admin: SupabaseClient,
  args: {
    userId: string
    productSlug: string
    subscription: StripeSubscriptionPayload
  },
) {
  const { userId, productSlug, subscription } = args
  const periodEnd =
    typeof subscription.current_period_end === 'number'
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null

  const row = {
    user_id: userId,
    product_slug: productSlug,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: String(subscription.customer),
    status: subscription.status,
    current_period_end: periodEnd,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    updated_at: new Date().toISOString(),
  }

  const { error } = await admin.from('user_subscriptions').upsert(row, {
    onConflict: 'user_id,product_slug',
  })
  if (error) throw new Error(`user_subscriptions upsert: ${error.message}`)

  const { error: syncErr } = await admin.rpc('sync_profile_has_active_subscription', {
    p_user_id: userId,
  })
  if (syncErr) throw new Error(`sync_profile_has_active_subscription: ${syncErr.message}`)
}

export async function recordWebhookEvent(admin: SupabaseClient, eventId: string, eventType: string) {
  const { error } = await admin.from('stripe_webhook_events').insert({
    stripe_event_id: eventId,
    event_type: eventType,
  })
  if (error?.code === '23505') return false
  if (error) throw new Error(`stripe_webhook_events insert: ${error.message}`)
  return true
}
