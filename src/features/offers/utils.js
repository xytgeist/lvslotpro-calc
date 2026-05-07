function pad2(n) {
  return String(n).padStart(2, '0')
}

export function localDateKeyFromIso(iso) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function localDateKeyFromDate(d) {
  if (!d) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function toDatetimeLocalValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

export function dateFromDatetimeLocalValue(v) {
  if (!v) return null
  const [datePart, timePart = '00:00'] = String(v).split('T')
  const [y, m, d] = datePart.split('-').map(Number)
  const [hh, mm] = timePart.split(':').map(Number)
  if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null
  return new Date(y, m - 1, d, hh, mm)
}

export function datetimeLocalValueFromDate(d) {
  if (!d) return ''
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(
    d.getMinutes()
  )}`
}

function isUtcMidnightIso(iso) {
  if (!iso) return false
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return false
  return d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCSeconds() === 0 && d.getUTCMilliseconds() === 0
}

function coerceUtcMidnightToLocalMidnight(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const offsetMin = new Date().getTimezoneOffset()
  const utcMs =
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0) + offsetMin * 60 * 1000
  return new Date(utcMs).toISOString()
}

export function normalizeLoadedEvent(ev) {
  if (!ev || ev.source_type !== 'image_ai') return ev
  const next = { ...ev }
  if (isUtcMidnightIso(next.start_at)) {
    next.start_at = coerceUtcMidnightToLocalMidnight(next.start_at)
  }
  if (next.end_at && isUtcMidnightIso(next.end_at)) {
    next.end_at = coerceUtcMidnightToLocalMidnight(next.end_at)
  }
  return next
}

export function shuffledCopy(items) {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export const OFFER_ALERT_NONE = 'none'
export const OFFER_ALERT_DAY_9AM = 'day_9am'
export const OFFER_ALERT_HOUR_BEFORE = 'hour_before'

/** Default iOS-style alert when opening the form (All day is on by default). */
export function defaultAlertPresetForAllDay(allDay) {
  return allDay ? OFFER_ALERT_DAY_9AM : OFFER_ALERT_HOUR_BEFORE
}

/** Keep preset consistent with all-day vs timed mode. */
export function coerceAlertPresetForMode(alertPreset, allDay) {
  if (alertPreset === OFFER_ALERT_NONE) return OFFER_ALERT_NONE
  if (allDay) {
    return alertPreset === OFFER_ALERT_HOUR_BEFORE ? OFFER_ALERT_DAY_9AM : alertPreset
  }
  return alertPreset === OFFER_ALERT_DAY_9AM ? OFFER_ALERT_HOUR_BEFORE : alertPreset
}

/**
 * When to send the reminder push (UTC ISO). null = no alert row / no push for this schedule.
 * @param {string} alertPreset
 * @param {Date} normalizedStart start instant (local all-day midnight or actual start)
 * @param {boolean} allDay
 */
export function computeOfferAlertFireIso(alertPreset, normalizedStart, allDay) {
  if (!normalizedStart || Number.isNaN(normalizedStart.getTime())) return null
  const safe = coerceAlertPresetForMode(alertPreset, allDay)
  if (safe === OFFER_ALERT_NONE) return null
  if (safe === OFFER_ALERT_HOUR_BEFORE) {
    return new Date(normalizedStart.getTime() - 60 * 60 * 1000).toISOString()
  }
  if (safe === OFFER_ALERT_DAY_9AM) {
    const atNine = new Date(
      normalizedStart.getFullYear(),
      normalizedStart.getMonth(),
      normalizedStart.getDate(),
      9,
      0,
      0,
      0
    )
    return atNine.toISOString()
  }
  return null
}

export function emptyOfferDraft() {
  return {
    casinoName: '',
    offerType: 'free_play',
    title: '',
    startAt: '',
    endAt: '',
    valueAmount: '',
    notes: '',
    alertPreset: OFFER_ALERT_DAY_9AM
  }
}

/** Normalizes AI / Edge Function JSON (snake or camel) into the add-event form shape. */
export function draftFromAiReviewPayload(raw) {
  if (!raw || typeof raw !== 'object') return emptyOfferDraft()
  const o = raw
  const va = o.valueAmount ?? o.value_amount
  const ot = o.offerType ?? o.offer_type ?? 'free_play'
  const allowedTypes = new Set(['free_play', 'hotel', 'dining', 'gift', 'multiplier', 'tournament', 'drawing', 'other'])
  const titleFromPayload = String(o.title ?? '').trim()
  const fallbackTitleByType = {
    free_play: 'Free play',
    hotel: 'Hotel stay',
    dining: 'Dining credit',
    gift: 'Gift',
    multiplier: 'Tier multiplier',
    tournament: 'Tournament',
    drawing: 'Drawing',
    other: 'Other'
  }
  const normalizedType = allowedTypes.has(ot) ? ot : 'free_play'
  const hasSpecificTime = o.hasSpecificTime === true || o.has_specific_time === true
  return {
    casinoName: String(o.casinoName ?? o.casino_name ?? ''),
    offerType: normalizedType,
    title: titleFromPayload || fallbackTitleByType[normalizedType] || 'Offer',
    startAt: String(o.startAt ?? o.start_at ?? ''),
    endAt: String(o.endAt ?? o.end_at ?? ''),
    valueAmount: va !== undefined && va !== null ? String(va) : '',
    notes: String(o.notes ?? ''),
    hasSpecificTime,
    alertPreset: defaultAlertPresetForAllDay(!hasSpecificTime)
  }
}
