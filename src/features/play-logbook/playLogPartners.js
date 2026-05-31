import { formatMetricValue } from './playLogMetrics.js'

/** @typedef {'user' | 'guest'} PlayLogPartnerKind */

/**
 * @typedef {Object} PlayLogPartnerRow
 * @property {string} key — stable React key
 * @property {PlayLogPartnerKind} kind
 * @property {string} [userId]
 * @property {string} [handle]
 * @property {string} [displayName]
 * @property {string} [avatarUrl]
 * @property {string} [guestLabel]
 * @property {string} sharePercent — form string, e.g. "50"
 * @property {boolean} [isManager]
 * @property {boolean} [paid]
 */

const PERCENT_SUM_TARGET = 100
const PERCENT_SUM_TOLERANCE = 0.02

/** @param {PlayLogPartnerRow[]} rows */
export function playLogPartnersPercentSum(rows) {
  return rows.reduce((acc, row) => {
    const n = Number(String(row.sharePercent ?? '').replace(/[^0-9.]/g, ''))
    return acc + (Number.isFinite(n) ? n : 0)
  }, 0)
}

/** @param {PlayLogPartnerRow[]} rows */
export function playLogPartnersSumValid(rows) {
  const sum = playLogPartnersPercentSum(rows)
  return Math.abs(sum - PERCENT_SUM_TARGET) < PERCENT_SUM_TOLERANCE
}

/** @param {PlayLogPartnerRow[]} rows */
export function playLogPartnersHasExtraPartner(rows, creatorUserId) {
  const creator = String(creatorUserId || '').trim()
  return rows.some(row => {
    if (row.kind === 'guest') return true
    return row.kind === 'user' && String(row.userId || '') !== creator
  })
}

/** @param {PlayLogPartnerRow[]} rows @param {string} creatorUserId */
export function playLogPartnersValidationError(rows, creatorUserId) {
  if (!rows.length) return 'Add your share percent.'
  const creator = String(creatorUserId || '').trim()
  if (!rows.some(r => r.kind === 'user' && String(r.userId) === creator)) {
    return 'Include yourself in partners.'
  }
  if (!playLogPartnersSumValid(rows)) {
    const sum = playLogPartnersPercentSum(rows)
    return `Partner shares must total 100% (currently ${sum.toFixed(1)}%).`
  }
  const managerCount = rows.filter(r => r.isManager).length
  if (managerCount !== 1) return 'Select exactly one play manager.'
  for (const row of rows) {
    const n = Number(String(row.sharePercent ?? '').replace(/[^0-9.]/g, ''))
    if (!Number.isFinite(n) || n <= 0 || n > 100) return 'Each partner needs a share between 0 and 100%.'
    if (row.kind === 'guest' && !String(row.guestLabel || '').trim()) return 'Enter a name for each guest partner.'
  }
  return null
}

/** @param {PlayLogPartnerRow[]} rows */
export function playLogPartnersToRpcPayload(rows) {
  return rows.map(row => {
    const share_percent = Number(String(row.sharePercent ?? '').replace(/[^0-9.]/g, ''))
    if (row.kind === 'guest') {
      return {
        kind: 'guest',
        guest_label: String(row.guestLabel || '').trim(),
        share_percent,
        is_manager: Boolean(row.isManager),
        paid: row.isManager ? false : Boolean(row.paid),
      }
    }
    return {
      kind: 'user',
      user_id: row.userId,
      share_percent,
      is_manager: Boolean(row.isManager),
      paid: row.isManager ? false : Boolean(row.paid),
    }
  })
}

/** @param {PlayLogPartnerRow[]} rows @param {string} managerKey */
export function playLogPartnersWithManager(rows, managerKey) {
  return rows.map(row => ({
    ...row,
    isManager: row.key === managerKey,
    paid: row.key === managerKey ? false : row.paid,
  }))
}

/** @param {PlayLogPartnerRow[]} rows @param {string} creatorUserId */
export function playLogPartnersEnsureManager(rows, creatorUserId) {
  if (rows.some(r => r.isManager)) return rows
  const creatorKey = rows.find(
    r => r.kind === 'user' && String(r.userId) === String(creatorUserId),
  )?.key
  if (!creatorKey) return rows
  return playLogPartnersWithManager(rows, creatorKey)
}

/** @param {PlayLogPartnerRow[]} rows @param {string} userId */
export function playLogPartnersViewerIsManager(rows, userId) {
  return rows.some(
    r => r.isManager && r.kind === 'user' && String(r.userId) === String(userId),
  )
}

/** Creator (session owner) or designated manager may mark partners paid. */
export function playLogPartnersViewerCanMarkPaid(rows, userId, creatorUserId) {
  const uid = String(userId || '').trim()
  if (!uid) return false
  if (String(creatorUserId || '').trim() === uid) return true
  return playLogPartnersViewerIsManager(rows, uid)
}

/** @param {string} userId @param {{ handle?: string, display_name?: string } | null} [profile] */
export function defaultCreatorPartnerRow(userId, profile) {
  return {
    key: `user:${userId}`,
    kind: 'user',
    userId,
    handle: profile?.handle || '',
    displayName: profile?.display_name || '',
    avatarUrl: '',
    sharePercent: '100',
    isManager: true,
    paid: false,
  }
}

/** @param {Array<Record<string, unknown>>} rows */
export function playLogPartnersFromSessionList(rows) {
  return (rows || []).map(row => {
    const kind = row.participant_kind === 'guest' ? 'guest' : 'user'
    const userId = row.user_id ? String(row.user_id) : ''
    const guestLabel = row.guest_label ? String(row.guest_label) : ''
    return {
      key: kind === 'guest' ? `guest:${row.id}` : `user:${userId}`,
      kind,
      userId: kind === 'user' ? userId : undefined,
      handle: row.handle ? String(row.handle) : '',
      displayName: row.display_name ? String(row.display_name) : '',
      avatarUrl: row.avatar_url ? String(row.avatar_url) : '',
      guestLabel: kind === 'guest' ? guestLabel : undefined,
      sharePercent: String(row.share_percent ?? ''),
      isManager: Boolean(row.is_manager),
      paid: Boolean(row.paid),
    }
  })
}

/**
 * Partner attribution: share of session net P&L (money out − money in − acquisition fee).
 * @param {number | null | undefined} netOutcome
 * @param {string} sharePercentStr
 * @returns {number | null}
 */
export function playLogPartnerOutcomeShareUsd(netOutcome, sharePercentStr) {
  if (netOutcome == null || !Number.isFinite(netOutcome)) return null
  const pct = Number(String(sharePercentStr ?? '').replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(pct) || pct <= 0) return null
  return netOutcome * (pct / 100)
}

/** @param {number | null | undefined} netOutcome @param {string} sharePercentStr */
export function formatPlayLogPartnerOutcomeShare(netOutcome, sharePercentStr) {
  const usd = playLogPartnerOutcomeShareUsd(netOutcome, sharePercentStr)
  if (usd == null) return null
  return formatMetricValue(usd, 'money')
}

/** @param {number | null | undefined} usd */
export function playLogPartnerOutcomeShareToneClass(usd) {
  if (usd == null || !Number.isFinite(usd)) return 'text-zinc-400'
  if (usd > 0) return 'text-emerald-300'
  if (usd < 0) return 'text-red-300'
  return 'text-zinc-300'
}

/** @param {{ handle?: string, display_name?: string, user_id?: string, avatar_url?: string }} profile */
export function playLogPartnerLabel(profile) {
  const name = String(profile?.display_name || '').trim()
  if (name) return name
  const handle = String(profile?.handle || '').trim()
  if (handle) return handle.startsWith('@') ? handle : `@${handle}`
  return 'Member'
}
