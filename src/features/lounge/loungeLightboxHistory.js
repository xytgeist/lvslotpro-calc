/** @typedef {{ loungeLightbox?: boolean }} LoungeLightboxHistoryState */

/** Skip the popstate handler once when we called `history.back()` to sync a UI dismiss. */
let uiSyncBack = false

/**
 * Bind browser / hardware back to `onClose` for one open lightbox session.
 * Call the returned cleanup when the lightbox closes (unmount or `lightboxOpen` → false).
 *
 * @param {() => void} onClose
 * @returns {() => void}
 */
export function bindLoungeLightboxHistory(onClose) {
  if (typeof window === 'undefined') return () => {}

  window.history.pushState({ loungeLightbox: true }, '')
  let active = true
  let popClosed = false

  const onPop = () => {
    if (uiSyncBack) {
      uiSyncBack = false
      return
    }
    if (!active) return
    active = false
    popClosed = true
    onClose()
  }

  window.addEventListener('popstate', onPop)

  return () => {
    window.removeEventListener('popstate', onPop)
    if (active && !popClosed) {
      active = false
      uiSyncBack = true
      window.history.back()
    }
  }
}
