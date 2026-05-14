/** Icon band height tracks the measured Lounge title bar (same chrome strip height). */
export function dockChromeHeightFromTitleBarPx(titleBarPx) {
  if (!(titleBarPx > 0)) return 0
  return Math.round(titleBarPx)
}
