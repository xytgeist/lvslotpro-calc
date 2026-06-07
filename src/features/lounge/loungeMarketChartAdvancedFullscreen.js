/** Fullscreen landscape shell for Advanced market chart (CSS rotate on portrait). */

/** @returns {boolean} */
export function isMarketChartPortraitViewport() {
  if (typeof window === 'undefined') return false
  return window.innerHeight > window.innerWidth
}

/**
 * Size/position the advanced chart shell — on portrait phones, rotate to landscape layout.
 * @param {boolean} [portrait]
 */
export function marketChartAdvancedFullscreenShellStyle(portrait = isMarketChartPortraitViewport()) {
  if (!portrait) {
    return {
      width: '100%',
      height: '100%',
    }
  }
  return {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '100dvh',
    height: '100dvw',
    maxWidth: '100dvh',
    maxHeight: '100dvw',
    transform: 'translate(-50%, -50%) rotate(90deg)',
  }
}

/** Best-effort OS landscape lock (no-op where unsupported, e.g. iOS Safari). */
export async function lockMarketChartLandscapeOrientation() {
  try {
    await screen.orientation?.lock?.('landscape')
  } catch {
    /* CSS rotation fallback */
  }
}

export function unlockMarketChartLandscapeOrientation() {
  try {
    screen.orientation?.unlock?.()
  } catch {
    /* ignore */
  }
}
