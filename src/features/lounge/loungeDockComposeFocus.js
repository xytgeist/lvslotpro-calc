/**
 * Focus the Lounge composer textarea after expand — retries cover panel close + mobile keyboard.
 * Call from any surface that mounts the feed composer (dock compose, future pages).
 */
export function scheduleLoungeComposerTextareaFocus({ getTextarea, scrollFeedToTop, isBlocked }) {
  const focus = () => {
    if (isBlocked?.()) return
    scrollFeedToTop?.()
    const el = getTextarea?.()
    if (!el) return
    try {
      el.focus({ preventScroll: true })
    } catch {
      el.focus()
    }
  }

  focus()
  const t1 = window.setTimeout(focus, 50)
  const t2 = window.setTimeout(focus, 150)
  const t3 = window.setTimeout(focus, 340)

  return () => {
    window.clearTimeout(t1)
    window.clearTimeout(t2)
    window.clearTimeout(t3)
  }
}
