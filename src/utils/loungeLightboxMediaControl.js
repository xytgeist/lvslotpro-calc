/**
 * Stop fullscreen lightbox playback before close/unmount.
 * Android Chrome can keep CF Stream iframe / HLS audio after React unmounts the portal.
 * @param {{ videoEl?: HTMLVideoElement | null, iframeEl?: HTMLIFrameElement | null, rootEl?: Element | null }} [opts]
 */
export function stopLoungeLightboxMedia({ videoEl = null, iframeEl = null, rootEl = null } = {}) {
  const stopVideo = (el) => {
    if (!(el instanceof HTMLVideoElement)) return
    try {
      el.muted = true
      el.volume = 0
      el.pause()
      el.removeAttribute('src')
      el.load()
    } catch {
      // ignore
    }
  }

  const stopIframe = (el) => {
    if (!(el instanceof HTMLIFrameElement)) return
    try {
      el.src = 'about:blank'
    } catch {
      // ignore
    }
    try {
      el.remove()
    } catch {
      // ignore
    }
  }

  try {
    stopVideo(videoEl)
    stopIframe(iframeEl)
    if (rootEl instanceof Element) {
      rootEl.querySelectorAll('video').forEach((el) => stopVideo(el))
      rootEl.querySelectorAll('iframe').forEach((el) => stopIframe(el))
    }
  } catch {
    // ignore
  }
}

/**
 * Feed Stream hero uses the same `<video>` through shrink; mute + pause at dismiss start
 * so swipe/back does not leave hero audio running during the FLIP (Android bleed).
 * Inline resume is handled in `finishHeroCloseAnimation`.
 * @param {HTMLVideoElement | null | undefined} videoEl
 */
export function pauseLoungeHeroStreamForDismiss(videoEl) {
  if (!(videoEl instanceof HTMLVideoElement)) return
  try {
    videoEl.muted = true
    videoEl.volume = 0
    videoEl.pause()
  } catch {
    // ignore
  }
}
