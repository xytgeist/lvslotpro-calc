/** @typedef {{ xPct: number, yPct: number, locked: boolean }} LoungeDockFabPrefs */

export const LOUNGE_DOCK_FAB_STORAGE_KEY = 'loungeDockFab:v1'
export const LOUNGE_DOCK_FAB_SIZE_PX = 50
const EDGE_PAD_PX = 12
const FAB_INSET_RIGHT_PX = 14
const FAB_INSET_BOTTOM_PX = 20

export const LOUNGE_DOCK_FAN_RADIUS_PX = 106
export const LOUNGE_DOCK_FAN_SWEEP_RAD = (138 * Math.PI) / 180
export const LOUNGE_DOCK_FAN_ITEM_RADIUS_PX = 17

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

/** Movable FAB bounds inside the viewport (safe-area friendly minimum padding). */
export function loungeDockFabMoveBounds(viewportW, viewportH, fabSize = LOUNGE_DOCK_FAB_SIZE_PX) {
  const minLeft = EDGE_PAD_PX
  const minTop = EDGE_PAD_PX
  const maxLeft = Math.max(minLeft, viewportW - fabSize - EDGE_PAD_PX)
  const maxTop = Math.max(minTop, viewportH - fabSize - EDGE_PAD_PX)
  return { minLeft, minTop, maxLeft, maxTop }
}

export function loungeDockFabDefaultPosition(viewportW, viewportH, fabSize = LOUNGE_DOCK_FAB_SIZE_PX) {
  const { maxLeft, maxTop } = loungeDockFabMoveBounds(viewportW, viewportH, fabSize)
  return {
    left: maxLeft - FAB_INSET_RIGHT_PX,
    top: maxTop - FAB_INSET_BOTTOM_PX,
  }
}

export function loungeDockFabPctFromPosition(left, top, bounds) {
  const spanX = bounds.maxLeft - bounds.minLeft || 1
  const spanY = bounds.maxTop - bounds.minTop || 1
  return {
    xPct: clamp((left - bounds.minLeft) / spanX, 0, 1),
    yPct: clamp((top - bounds.minTop) / spanY, 0, 1),
  }
}

export function loungeDockFabPositionFromPct(xPct, yPct, bounds) {
  return {
    left: bounds.minLeft + clamp(xPct, 0, 1) * (bounds.maxLeft - bounds.minLeft),
    top: bounds.minTop + clamp(yPct, 0, 1) * (bounds.maxTop - bounds.minTop),
  }
}

export function readLoungeDockFabPrefs() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(LOUNGE_DOCK_FAB_STORAGE_KEY)
    if (!raw) return null
    const o = JSON.parse(raw)
    if (typeof o?.xPct !== 'number' || typeof o?.yPct !== 'number') return null
    return {
      xPct: clamp(o.xPct, 0, 1),
      yPct: clamp(o.yPct, 0, 1),
      locked: Boolean(o.locked),
    }
  } catch {
    return null
  }
}

/** @param {LoungeDockFabPrefs} prefs */
export function writeLoungeDockFabPrefs(prefs) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      LOUNGE_DOCK_FAB_STORAGE_KEY,
      JSON.stringify({
        xPct: clamp(prefs.xPct, 0, 1),
        yPct: clamp(prefs.yPct, 0, 1),
        locked: Boolean(prefs.locked),
      }),
    )
  } catch {
    /* quota / private mode */
  }
}

export function loungeDockViewportSize() {
  const vv = typeof window !== 'undefined' ? window.visualViewport : null
  return {
    width: vv?.width ?? window.innerWidth,
    height: vv?.height ?? window.innerHeight,
  }
}

/**
 * Fan item offsets from FAB center, biased toward screen interior and clamped inside edges.
 * @param {number} fabCenterX
 * @param {number} fabCenterY
 * @param {number} itemCount
 * @param {{ width: number, height: number }} viewport
 */
export function loungeDockFanOffsets(fabCenterX, fabCenterY, itemCount, viewport) {
  if (itemCount <= 0) return []

  const midX = viewport.width / 2
  const midY = viewport.height / 2
  let dirX = midX - fabCenterX
  let dirY = midY - fabCenterY
  const dirLen = Math.hypot(dirX, dirY)
  if (dirLen < 1) {
    dirX = 0
    dirY = -1
  } else {
    dirX /= dirLen
    dirY /= dirLen
  }

  /** angleFromUp where offset = (-sin(a), -cos(a)) * r */
  const bisector = Math.atan2(-dirX, -dirY)
  const half = LOUNGE_DOCK_FAN_SWEEP_RAD / 2
  const pad = EDGE_PAD_PX
  const itemR = LOUNGE_DOCK_FAN_ITEM_RADIUS_PX

  const offsets = []
  for (let i = 0; i < itemCount; i += 1) {
    const t = itemCount === 1 ? 0.5 : i / (itemCount - 1)
    const angle = bisector - half + t * LOUNGE_DOCK_FAN_SWEEP_RAD
    let x = -Math.sin(angle) * LOUNGE_DOCK_FAN_RADIUS_PX
    let y = -Math.cos(angle) * LOUNGE_DOCK_FAN_RADIUS_PX

    const cx = fabCenterX + x
    const cy = fabCenterY + y
    const clampedCx = clamp(cx, pad + itemR, viewport.width - pad - itemR)
    const clampedCy = clamp(cy, pad + itemR, viewport.height - pad - itemR)
    offsets.push({ x: clampedCx - fabCenterX, y: clampedCy - fabCenterY })
  }
  return offsets
}
