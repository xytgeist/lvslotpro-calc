/** @typedef {'engagement' | 'recent'} LoungeSearchSortMode */

export const LOUNGE_SEARCH_SORT_STORAGE_KEY = 'loungeSearchSort:v1'

export const LOUNGE_SEARCH_SORT = {
  ENGAGEMENT: 'engagement',
  RECENT: 'recent',
}

const SORT_VALUES = new Set(Object.values(LOUNGE_SEARCH_SORT))

/** @returns {LoungeSearchSortMode} */
export function readLoungeSearchSort() {
  if (typeof window === 'undefined') return LOUNGE_SEARCH_SORT.ENGAGEMENT
  try {
    const v = window.localStorage.getItem(LOUNGE_SEARCH_SORT_STORAGE_KEY)
    if (SORT_VALUES.has(v)) return /** @type {LoungeSearchSortMode} */ (v)
  } catch {
    // ignore
  }
  return LOUNGE_SEARCH_SORT.ENGAGEMENT
}

/** @param {LoungeSearchSortMode} mode */
export function writeLoungeSearchSort(mode) {
  if (typeof window === 'undefined' || !SORT_VALUES.has(mode)) return
  try {
    window.localStorage.setItem(LOUNGE_SEARCH_SORT_STORAGE_KEY, mode)
  } catch {
    // ignore
  }
}

/** @param {string} [rawMessage] */
export function loungeSearchRateLimitMessage(rawMessage) {
  const m = /retry_in_seconds=(\d+)/i.exec(String(rawMessage || ''))
  const secs = m ? Number(m[1]) : NaN
  if (!Number.isFinite(secs) || secs <= 0) {
    return 'Too many searches. Please wait a few minutes and try again.'
  }
  const mm = Math.floor(secs / 60)
  const ss = secs % 60
  const tail = mm > 0 ? `${mm}m ${String(ss).padStart(2, '0')}s` : `${secs}s`
  return `Too many searches. Try again in ${tail}.`
}

/** @param {string} [rawMessage] */
export function loungeSearchErrorMessage(rawMessage) {
  const msg = String(rawMessage || '')
  if (/rate limit exceeded/i.test(msg)) return loungeSearchRateLimitMessage(msg)
  if (/timeout|query_canceled|57014|canceling statement/i.test(msg)) {
    return 'Search took too long. Try a shorter or more specific query.'
  }
  return msg || 'Search failed.'
}
