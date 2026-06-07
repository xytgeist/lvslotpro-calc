/** Horizontal pan + history prefetch for Advanced market charts. */

/** Shift visible range by horizontal drag delta (px). */
export function scrollMarketChartByPixels(chart, deltaPx) {
  if (!chart || !deltaPx) return
  const ts = chart.timeScale()
  const range = ts.getVisibleLogicalRange()
  if (!range) return
  const coord0 = ts.logicalToCoordinate(range.from)
  const coord1 = ts.logicalToCoordinate(range.from + 1)
  if (coord0 == null || coord1 == null) return
  const barWidthPx = coord1 - coord0
  if (!Number.isFinite(barWidthPx) || barWidthPx === 0) return
  const barShift = deltaPx / barWidthPx
  ts.setVisibleLogicalRange({
    from: range.from - barShift,
    to: range.to - barShift,
  })
}

const PAN_GESTURE_SLOP_PX = 8

/**
 * Drag on the plot pans the time scale (Advanced view).
 * @param {HTMLElement} el
 * @param {import('lightweight-charts').IChartApi} chart
 * @param {{ priceAxisHit?: (clientX: number, clientY?: number) => boolean }} [opts]
 */
export function bindMarketChartPanPointer(el, chart, opts = {}) {
  const priceAxisHit =
    typeof opts.priceAxisHit === 'function' ? opts.priceAxisHit : null

  /** @type {'pending' | 'pan' | null} */
  let mode = null
  let activePointerId = null
  let startX = 0
  let startY = 0
  let lastPanX = null

  const releaseCapture = (pointerId) => {
    if (!el.hasPointerCapture(pointerId)) return
    try {
      el.releasePointerCapture(pointerId)
    } catch {
      /* ignore */
    }
  }

  const resetGesture = () => {
    mode = null
    activePointerId = null
    lastPanX = null
  }

  const onPointerDown = (e) => {
    if (priceAxisHit?.(e.clientX, e.clientY)) return
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.stopPropagation()
    resetGesture()
    mode = 'pending'
    activePointerId = e.pointerId
    startX = e.clientX
    startY = e.clientY
  }

  const onPointerMove = (e) => {
    if (activePointerId == null || e.pointerId !== activePointerId) return

    if (mode === 'pending') {
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      if (Math.abs(dx) < PAN_GESTURE_SLOP_PX && Math.abs(dy) < PAN_GESTURE_SLOP_PX) return
      if (Math.abs(dx) < Math.abs(dy)) {
        resetGesture()
        return
      }
      mode = 'pan'
      chart.timeScale().applyOptions({ fixRightEdge: false })
      el.setPointerCapture(e.pointerId)
      lastPanX = e.clientX
      e.preventDefault()
      e.stopPropagation()
      return
    }

    if (mode === 'pan') {
      e.preventDefault()
      e.stopPropagation()
      if (lastPanX != null) {
        scrollMarketChartByPixels(chart, e.clientX - lastPanX)
      }
      lastPanX = e.clientX
    }
  }

  const onPointerEnd = (e) => {
    if (activePointerId == null || e.pointerId !== activePointerId) return
    releaseCapture(e.pointerId)
    resetGesture()
  }

  const capture = { capture: true }
  el.addEventListener('pointerdown', onPointerDown, capture)
  el.addEventListener('pointermove', onPointerMove, capture)
  el.addEventListener('pointerup', onPointerEnd, capture)
  el.addEventListener('pointercancel', onPointerEnd, capture)

  return () => {
    el.removeEventListener('pointerdown', onPointerDown, capture)
    el.removeEventListener('pointermove', onPointerMove, capture)
    el.removeEventListener('pointerup', onPointerEnd, capture)
    el.removeEventListener('pointercancel', onPointerEnd, capture)
  }
}

/**
 * When the visible window nears the oldest loaded bar, request older history.
 * @param {import('lightweight-charts').IChartApi} chart
 * @param {() => Array<{ t: number }>} getBars
 * @param {(beforeSec: number) => void} onNeedHistory
 * @param {{ edgeBars?: number, canLoad?: () => boolean }} [opts]
 */
export function bindMarketChartHistoryLoader(chart, getBars, onNeedHistory, opts = {}) {
  const edgeBars = Number(opts.edgeBars) || 10
  const canLoad = typeof opts.canLoad === 'function' ? opts.canLoad : () => true
  let lastBeforeSec = null
  let lastBarCount = 0

  const handler = (range) => {
    if (!range || range.from > edgeBars) return
    if (!canLoad()) return
    const bars = getBars()
    if (!bars?.length) return
    if (bars.length > lastBarCount) {
      lastBeforeSec = null
      lastBarCount = bars.length
    }
    const oldest = bars[0]
    const beforeSec = Math.floor(oldest.t > 1e12 ? oldest.t / 1000 : oldest.t)
    if (!Number.isFinite(beforeSec) || beforeSec <= 0) return
    if (lastBeforeSec === beforeSec) return
    lastBeforeSec = beforeSec
    onNeedHistory(beforeSec)
  }

  const ts = chart.timeScale()
  ts.subscribeVisibleLogicalRangeChange(handler)
  return () => {
    ts.unsubscribeVisibleLogicalRangeChange(handler)
  }
}

/** Preserve viewport when prepending `added` bars to the series. */
export function shiftMarketChartLogicalRange(chart, added) {
  if (!chart || !added) return
  const ts = chart.timeScale()
  const range = ts.getVisibleLogicalRange()
  if (!range) return
  ts.setVisibleLogicalRange({
    from: range.from + added,
    to: range.to + added,
  })
}
