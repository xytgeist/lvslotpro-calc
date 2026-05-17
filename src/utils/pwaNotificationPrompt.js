import {
  OFFERS_IOS_PWA_ENABLE_PENDING_KEY_PREFIX,
  OFFERS_IOS_PWA_NOTIF_PROMPT_KEY_PREFIX,
} from '../features/offers/offerStorageKeys'

export function isIosDevice() {
  if (typeof window === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(window.navigator.userAgent || '')
}

export function isStandalonePwa() {
  if (typeof window === 'undefined') return false
  const standaloneViaMedia = window.matchMedia?.('(display-mode: standalone)')?.matches === true
  const standaloneViaNavigator = window.navigator.standalone === true
  return standaloneViaMedia || standaloneViaNavigator
}

export function getPwaNotifPromptStorageKey(userId) {
  return `${OFFERS_IOS_PWA_NOTIF_PROMPT_KEY_PREFIX}${userId}`
}

export function getPwaNotifEnablePendingStorageKey(userId) {
  return `${OFFERS_IOS_PWA_ENABLE_PENDING_KEY_PREFIX}${userId}`
}

export function hasSeenPwaNotifPrompt(userId) {
  if (!userId || typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(getPwaNotifPromptStorageKey(userId)) === '1'
  } catch {
    return false
  }
}

/** Call as soon as we commit to showing the prompt (prevents duplicate dialogs). */
export function markPwaNotifPromptSeen(userId) {
  if (!userId || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getPwaNotifPromptStorageKey(userId), '1')
  } catch {
    // Ignore storage failures (private mode, etc.).
  }
}

export function setPwaNotifEnablePending(userId) {
  if (!userId || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getPwaNotifEnablePendingStorageKey(userId), '1')
  } catch {
    // Ignore storage failures.
  }
}

export function consumePwaNotifEnablePending(userId) {
  if (!userId || typeof window === 'undefined') return false
  try {
    const key = getPwaNotifEnablePendingStorageKey(userId)
    const pending = window.localStorage.getItem(key) === '1'
    if (pending) window.localStorage.removeItem(key)
    return pending
  } catch {
    return false
  }
}

/** Auth events where we may show the one-time PWA notification prompt. */
export function isPwaNotifPromptAuthEvent(event) {
  return event === 'SIGNED_IN' || event === 'INITIAL_SESSION'
}
