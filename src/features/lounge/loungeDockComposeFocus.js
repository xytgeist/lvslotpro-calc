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

/**
 * Focus the Lounge composer textarea after expand — retries cover panel close + lazy layout.
 */
export function scheduleLoungeComposerTextareaFocus({ getTextarea, scrollFeedToTop, isBlocked }) {
  const run = () => {
    if (isBlocked?.()) return
    focusLoungeComposerCaption(getTextarea, { scrollFeedToTop })
  }

  run()
  const t1 = window.setTimeout(run, 50)
  const t2 = window.setTimeout(run, 150)
  const t3 = window.setTimeout(run, 340)
  const raf = typeof window.requestAnimationFrame === 'function' ? window.requestAnimationFrame(run) : 0

  return () => {
    window.clearTimeout(t1)
    window.clearTimeout(t2)
    window.clearTimeout(t3)
    if (raf) window.cancelAnimationFrame(raf)
  }
}
