/**
 * Focus caption and place caret at end. Call synchronously from a click/pointer handler when
 * possible so mobile Safari keeps the tap “user activation” and shows the keyboard.
 *
 * @param {() => HTMLElement | null} getTextarea
 * @param {{ scrollFeedToTop?: () => void }} [opts]
 * @returns {boolean} whether the textarea was found and focus was attempted
 */
export function focusLoungeComposerCaption(getTextarea, opts = {}) {
  opts.scrollFeedToTop?.()
  const el = getTextarea?.()
  if (!el) return false
  try {
    el.focus({ preventScroll: true })
  } catch {
    try {
      el.focus()
    } catch {
      return false
    }
  }
  const len = typeof el.value === 'string' ? el.value.length : 0
  try {
    el.setSelectionRange(len, len)
  } catch {
    // ignore
  }
  return true
}

/** Extra retries after image carousel mounts / previews decode (iOS often blurs again). */
export const LOUNGE_COMPOSER_FOCUS_AFTER_MEDIA_DELAYS_MS = [600, 1000, 1500]

/**
 * Focus the Lounge composer textarea after expand — retries cover panel close + lazy layout.
 *
 * @param {{ extraDelaysMs?: number[] }} [opts]
 */
export function scheduleLoungeComposerTextareaFocus({
  getTextarea,
  scrollFeedToTop,
  isBlocked,
  extraDelaysMs = [],
}) {
  const run = () => {
    if (isBlocked?.()) return
    focusLoungeComposerCaption(getTextarea, { scrollFeedToTop })
  }

  run()
  const baseDelays = [50, 150, 340]
  const delays = [...baseDelays, ...extraDelaysMs]
  const timers = delays.map((ms) => window.setTimeout(run, ms))
  const raf = typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame(run) : 0

  return () => {
    for (const id of timers) window.clearTimeout(id)
    if (raf) window.cancelAnimationFrame(raf)
  }
}
