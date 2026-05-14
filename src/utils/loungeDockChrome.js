/** Icon band is ~⅔ of the measured title bar so the full-bleed dock (icons + home safe padding) does not read taller than the top chrome. */
export const LOUNGE_DOCK_CHROME_TITLE_RATIO = 2 / 3
export const LOUNGE_DOCK_CHROME_MIN_PX = 36

export function dockChromeHeightFromTitleBarPx(titleBarPx) {
  if (!(titleBarPx > 0)) return 0
  return Math.max(LOUNGE_DOCK_CHROME_MIN_PX, Math.round(titleBarPx * LOUNGE_DOCK_CHROME_TITLE_RATIO))
}
