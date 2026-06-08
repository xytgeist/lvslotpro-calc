/** Keep slot-guide-form full viewport height after native file picker (Chrome/Windows). */

let slotGuideViewportMaxPx = 0

function readViewportHeightPx() {
  if (typeof window === 'undefined') return 0
  return Math.round(window.visualViewport?.height ?? window.innerHeight)
}

/** @param {{ force?: boolean }} [opts] */
export function syncSlotGuideViewport(opts = {}) {
  if (typeof document === 'undefined') return
  const h = readViewportHeightPx()
  if (!h) return

  if (opts.force || h > slotGuideViewportMaxPx) {
    slotGuideViewportMaxPx = h
  } else if (h < slotGuideViewportMaxPx * 0.85) {
    // Native file picker often shrinks innerHeight / visualViewport — ignore dip.
  } else {
    slotGuideViewportMaxPx = h
  }

  document.documentElement.style.setProperty('--slot-guide-vh', `${slotGuideViewportMaxPx}px`)
}

export function initSlotGuideViewport() {
  if (typeof window === 'undefined') return () => {}

  slotGuideViewportMaxPx = readViewportHeightPx()
  syncSlotGuideViewport({ force: true })

  const onResize = () => syncSlotGuideViewport()
  const onFocus = () => {
    window.setTimeout(() => syncSlotGuideViewport({ force: true }), 50)
    window.setTimeout(() => syncSlotGuideViewport({ force: true }), 250)
  }

  window.addEventListener('resize', onResize)
  window.visualViewport?.addEventListener('resize', onResize)
  window.addEventListener('focus', onFocus)

  return () => {
    window.removeEventListener('resize', onResize)
    window.visualViewport?.removeEventListener('resize', onResize)
    window.removeEventListener('focus', onFocus)
    document.documentElement.style.removeProperty('--slot-guide-vh')
    slotGuideViewportMaxPx = 0
  }
}

/**
 * @param {import('@supabase/supabase-js').PostgrestSingleResponse<unknown>} result
 * @param {string} label
 */
export function assertSupabaseRowUpdated(result, label) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`)
  const row = result.data
  if (row == null || (Array.isArray(row) && row.length === 0)) {
    throw new Error(
      `${label}: no row updated (RLS blocked or guide not found). Apply supabase/guide_admin_rls.sql on test and sign in as admin.`,
    )
  }
}
