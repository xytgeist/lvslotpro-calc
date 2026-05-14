/** Shorter than title bar so the Lounge dock footer does not feel oversized on iOS. */
export const LOUNGE_DOCK_CHROME_TITLE_RATIO = 2 / 3
export const LOUNGE_DOCK_CHROME_MIN_PX = 36

export function dockChromeHeightFromTitleBarPx(titleBarPx) {
  if (!(titleBarPx > 0)) return 0
  return Math.max(LOUNGE_DOCK_CHROME_MIN_PX, Math.round(titleBarPx * LOUNGE_DOCK_CHROME_TITLE_RATIO))
}
