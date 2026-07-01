import Stripe from 'npm:stripe@17.7.0'
import { billingCorsHeaders, jsonResponse } from '../_shared/billingCors.ts'
import { requireStripeSecretKey } from '../_shared/billingEnv.ts'
import { createBillingAdmin, getUserFromJwt } from '../_shared/billingDb.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: billingCorsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const admin = createBillingAdmin()
    const auth = await getUserFromJwt(admin, req)
    if ('error' in auth) return jsonResponse({ error: auth.error }, auth.status)

    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('user_id', auth.user.id)
      .maybeSingle()
    if (profileErr) throw new Error(profileErr.message)

    const customerId = profile?.stripe_customer_id?.trim()
    if (!customerId) {
      return jsonResponse({ error: 'No billing account yet. Subscribe to a plan first.' }, 400)
    }

    const origin =
      req.headers.get('origin')?.trim() ||
      Deno.env.get('STRIPE_CHECKOUT_DEFAULT_ORIGIN')?.trim() ||
      'http://localhost:5173'
    const returnUrl = `${origin.replace(/\/+$/, '')}/?billing=portal`

    const stripe = new Stripe(requireStripeSecretKey())
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return jsonResponse({ url: portal.url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return jsonResponse({ error: msg || 'Server error' }, 500)
  }
})
