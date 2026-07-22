import Stripe from 'npm:stripe@17.7.0'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2'
import {
  isCreatorFanSubscriptionMetadata,
  upsertCreatorFanSubscriptionFromStripe,
  type StripeSubscriptionPayload,
} from './billingDb.ts'

function toPayload(sub: Stripe.Subscription): StripeSubscriptionPayload {
  const customer =
    typeof sub.customer === 'string' ? sub.customer : sub.customer?.id != null ? String(sub.customer.id) : ''
  return {
    id: sub.id,
    customer,
    status: sub.status,
    cancel_at_period_end: sub.cancel_at_period_end,
    current_period_end: sub.current_period_end,
    metadata: (sub.metadata ?? {}) as Record<string, string>,
  }
}

export type CreatorFanReconcileResult = {
  scanned: number
  synced: number
  skipped: number
  errors: string[]
}

/** List Stripe subs in grant-worthy statuses and upsert fan rows missing or stale in Postgres. */
export async function reconcileAllCreatorFanSubscriptions(
  admin: SupabaseClient,
  stripe: Stripe,
  opts?: { dryRun?: boolean },
): Promise<CreatorFanReconcileResult> {
  const result: CreatorFanReconcileResult = { scanned: 0, synced: 0, skipped: 0, errors: [] }
  const statuses: Stripe.SubscriptionListParams['status'][] = ['active', 'trialing', 'past_due']

  for (const status of statuses) {
    let startingAfter: string | undefined
    for (;;) {
      const page = await stripe.subscriptions.list({
        status,
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })

      for (const sub of page.data) {
        const meta = (sub.metadata ?? {}) as Record<string, string>
        if (!isCreatorFanSubscriptionMetadata(meta)) {
          result.skipped++
          continue
        }
        result.scanned++
        if (opts?.dryRun) {
          result.synced++
          continue
        }
        try {
          await upsertCreatorFanSubscriptionFromStripe(admin, { subscription: toPayload(sub) })
          result.synced++
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          result.errors.push(`${sub.id}: ${msg}`)
        }
      }

      if (!page.has_more || page.data.length === 0) break
      startingAfter = page.data[page.data.length - 1]?.id
    }
  }

  return result
}
