/** Bookmarkable admin ops dashboard (desktop-first). */
export const EDGE_MONITOR_PATH = '/monitor'

/** @param {string} [pathname] */
export function parseMonitorPathname(pathname) {
  const path = String(pathname || '/').replace(/\/+$/, '') || '/'
  return path === EDGE_MONITOR_PATH
}
