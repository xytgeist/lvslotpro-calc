/**
 * Service-role / cron: reconcile creator_subscriptions from Stripe fan metadata.
 * Schedule via pg_cron migration 20260722210000 (daily).
 */
import Stripe from 'npm:stripe@17.7.0'
import { billingCorsHeaders, jsonResponse } from '../_shared/billingCors.ts'
import { requireStripeSecretKey } from '../_shared/billingEnv.ts'
import { createBillingAdmin } from '../_shared/billingDb.ts'
import { isKnownServiceRoleBearer } from '../_shared/adminAuth.ts'
import { reconcileAllCreatorFanSubscriptions } from '../_shared/creatorFanStripeReconcile.ts'
import { sendBillingFanReconcileAdminAlert } from '../_shared/billingAdminAlert.ts'

function isAuthorized(req: Request): boolean {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim() || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim() || ''
  const bearer = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
  const cronSecret = Deno.env.get('CREATOR_FAN_RECONCILE_CRON_SECRET')?.trim()
  const headerSecret = req.headers.get('x-creator-fan-reconcile-secret')?.trim()

  if (serviceRoleKey && isKnownServiceRoleBearer(bearer, serviceRoleKey, supabaseUrl)) {
    return true
  }
  if (cronSecret && (bearer === cronSecret || headerSecret === cronSecret)) {
    return true
  }
  return false
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: billingCorsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }
  if (!isAuthorized(req)) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  try {
    let dryRun = new URL(req.url).searchParams.get('dryRun') === '1'
    try {
      const body = await req.json()
      if (body && typeof body === 'object' && body.dryRun === true) dryRun = true
    } catch {
      /* empty body ok for cron */
    }

    const admin = createBillingAdmin()
    const stripe = new Stripe(requireStripeSecretKey())
    const result = await reconcileAllCreatorFanSubscriptions(admin, stripe, { dryRun })
    await sendBillingFanReconcileAdminAlert(admin, { ...result, dryRun })
    return jsonResponse({ ok: true, dryRun, ...result })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('creator-fan-reconcile-stripe', msg)
    try {
      const admin = createBillingAdmin()
      await sendBillingFanReconcileAdminAlert(admin, {
        scanned: 0,
        synced: 0,
        skipped: 0,
        errors: [msg],
      })
    } catch {
      /* alert is best-effort */
    }
    return jsonResponse({ error: msg || 'Reconcile failed' }, 500)
  }
})
