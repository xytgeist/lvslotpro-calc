/** Formatters + CSV export for Edge Monitor subscriber roster. */

import { buildLoungeProfileShareUrl } from '../../utils/loungeSharePost.js'

/** @param {string | null | undefined} iso */
export function formatOpsRosterWhen(iso) {
  if (!iso) return '...'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '...'
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

/** @param {string | null | undefined} handle */
export function formatOpsRosterHandle(handle) {
  const h = String(handle || '').trim()
  if (!h) return '(no handle)'
  return h.startsWith('@') ? h : `@${h}`
}

/**
 * In-app profile deep link (`/u/:handle` or legacy `/?tab=home&profile=<uuid>`).
 * @param {{ handle?: string | null, user_id?: string | null }} profile
 */
export function opsMonitorProfileHref(profile) {
  if (!profile) return ''
  return buildLoungeProfileShareUrl({
    handle: profile.handle,
    user_id: profile.user_id,
  })
}

/** @param {string | null | undefined} id */
function normalizeStripeId(id) {
  const s = String(id || '').trim()
  return s || ''
}

/** @param {string | null | undefined} customerId */
export function opsStripeCustomerDashboardUrl(customerId) {
  const id = normalizeStripeId(customerId)
  if (!id.startsWith('cus_')) return ''
  return `https://dashboard.stripe.com/customers/${encodeURIComponent(id)}`
}

/** @param {string | null | undefined} subscriptionId */
export function opsStripeSubscriptionDashboardUrl(subscriptionId) {
  const id = normalizeStripeId(subscriptionId)
  if (!id.startsWith('sub_')) return ''
  return `https://dashboard.stripe.com/subscriptions/${encodeURIComponent(id)}`
}

/**
 * Connect fan sub deep link when both ids are known.
 * @param {string | null | undefined} connectAccountId
 * @param {string | null | undefined} subscriptionId
 */
export function opsStripeConnectSubscriptionDashboardUrl(connectAccountId, subscriptionId) {
  const acct = normalizeStripeId(connectAccountId)
  const sub = normalizeStripeId(subscriptionId)
  if (!acct.startsWith('acct_') || !sub.startsWith('sub_')) return ''
  return `https://dashboard.stripe.com/connect/accounts/${encodeURIComponent(acct)}/subscriptions/${encodeURIComponent(sub)}`
}

/** @param {string | null | undefined} connectAccountId */
export function opsStripeConnectAccountDashboardUrl(connectAccountId) {
  const id = normalizeStripeId(connectAccountId)
  if (!id.startsWith('acct_')) return ''
  return `https://dashboard.stripe.com/connect/accounts/${encodeURIComponent(id)}`
}

/** @param {Array<Record<string, unknown>>} rows */
function csvEscapeRows(rows, columns) {
  const esc = (v) => {
    const s = String(v ?? '')
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  const header = columns.map((c) => c.label).join(',')
  const lines = rows.map((row) => columns.map((c) => esc(c.value(row))).join(','))
  return `${header}\n${lines.join('\n')}\n`
}

/** @param {Array<Record<string, unknown>>} rows */
export function opsPlatformSubscribersToCsv(rows) {
  return csvEscapeRows(rows, [
    { label: 'handle', value: (r) => r.handle },
    { label: 'display_name', value: (r) => r.display_name },
    { label: 'email', value: (r) => r.email },
    { label: 'product', value: (r) => r.product_slug },
    { label: 'status', value: (r) => r.status },
    { label: 'interval', value: (r) => r.price_interval },
    { label: 'cancel_at_period_end', value: (r) => (r.cancel_at_period_end ? 'yes' : 'no') },
    { label: 'period_end', value: (r) => r.current_period_end },
    { label: 'subscribed_at', value: (r) => r.subscribed_at },
    { label: 'stripe_customer_id', value: (r) => r.stripe_customer_id },
    { label: 'stripe_subscription_id', value: (r) => r.stripe_subscription_id },
  ])
}

/** @param {Array<Record<string, unknown>>} rows */
export function opsFanSubscribersToCsv(rows) {
  return csvEscapeRows(rows, [
    { label: 'subscriber_handle', value: (r) => r.subscriber_handle },
    { label: 'subscriber_email', value: (r) => r.subscriber_email },
    { label: 'creator_handle', value: (r) => r.creator_handle },
    { label: 'tier_key', value: (r) => r.fan_tier_key },
    { label: 'status', value: (r) => r.status },
    { label: 'cancel_at_period_end', value: (r) => (r.cancel_at_period_end ? 'yes' : 'no') },
    { label: 'period_end', value: (r) => r.current_period_end },
    { label: 'subscribed_at', value: (r) => r.subscribed_at },
    { label: 'stripe_customer_id', value: (r) => r.stripe_customer_id },
    { label: 'stripe_subscription_id', value: (r) => r.stripe_subscription_id },
  ])
}

/** @param {Array<Record<string, unknown>>} rows */
export function opsRecentSignupsToCsv(rows) {
  return csvEscapeRows(rows, [
    { label: 'handle', value: (r) => r.handle },
    { label: 'display_name', value: (r) => r.display_name },
    { label: 'email', value: (r) => r.email },
    { label: 'role', value: (r) => r.role },
    { label: 'created_at', value: (r) => r.created_at },
    { label: 'stripe_customer_id', value: (r) => r.stripe_customer_id },
  ])
}

/** @param {string} csv @param {string} filename */
export function downloadOpsMonitorCsv(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** @param {object | null | undefined} roster */
export function opsMonitorRosterSummary(roster) {
  const users = roster?.users || {}
  const platform = roster?.platform || {}
  const fan = roster?.creator_fan || {}
  const activePlatform = Array.isArray(platform.active_roster) ? platform.active_roster.length : 0
  const pendingPlatform = Array.isArray(platform.pending_cancel) ? platform.pending_cancel.length : 0
  const activeFan = Array.isArray(fan.active_roster) ? fan.active_roster.length : 0
  const pendingFan = Array.isArray(fan.pending_cancel) ? fan.pending_cancel.length : 0
  const monetizedCreators = Array.isArray(fan.monetized_creators) ? fan.monetized_creators.length : 0
  return {
    new24h: users.new_24h,
    new7d: users.new_7d,
    new30d: users.new_30d,
    activePlatform,
    pendingPlatform,
    activeFan,
    pendingFan,
    monetizedCreators,
  }
}
