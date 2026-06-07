/** Vertical zoom on the Advanced chart right price scale (wheel + drag). */

const WHEEL_ZOOM_SENS = 0.0018
const DRAG_ZOOM_SENS = 0.004
const MIN_RANGE_RATIO = 0.00005
const MAX_RANGE_RATIO = 50

/**
 * @param {number} clientX
 * @param {number} clientY
 * @param {DOMRect} hostRect
 * @param {number} priceScaleWidth
 * @param {number} [maxPlotLocalY] max Y in host-local coords for the main price pane (excludes volume / oscillators)
 */
export function marketChartPriceAxisHit(clientX, clientY, hostRect, priceScaleWidth, maxPlotLocalY = Infinity) {
  if (!hostRect?.width || !priceScaleWidth) return false
  const relX = clientX - hostRect.left
  const relY = clientY - hostRect.top
  if (relX < hostRect.width - priceScaleWidth) return false
  if (relY > maxPlotLocalY) return false
  return true
}

/**
 * @param {import('lightweight-charts').ISeriesApi} mainSeries
 * @param {number} deltaPx wheel deltaY or vertical drag delta
 * @param {number} anchorClientY focal Y in client coordinates
 * @param {DOMRect} hostRect
 * @param {'wheel' | 'drag'} mode
 */
export function zoomMarketChartPriceScale(mainSeries, deltaPx, anchorClientY, hostRect, mode = 'wheel') {
  const scale = mainSeries.priceScale()
  const range = scale.getVisibleRange()
  if (!range) return false

  const span = range.to - range.from
  if (!Number.isFinite(span) || span <= 0) return false

  const sens = mode === 'drag' ? DRAG_ZOOM_SENS : WHEEL_ZOOM_SENS
  // Drag/wheel delta: up / scroll-up → zoom in; down → zoom out.
  const signedDelta = deltaPx
  const factor = Math.exp(signedDelta * sens)
  const dataSpan = span
  let newSpan = span * factor
  newSpan = Math.max(dataSpan * MIN_RANGE_RATIO, Math.min(dataSpan * MAX_RANGE_RATIO, newSpan))

  const anchorY = anchorClientY - hostRect.top
  const anchorPrice = mainSeries.coordinateToPrice(anchorY)
  const center = Number.isFinite(anchorPrice) ? anchorPrice : (range.from + range.to) / 2
  const fromRatio = span > 0 ? (center - range.from) / span : 0.5

  scale.applyOptions({ autoScale: false })
  scale.setVisibleRange({
    from: center - newSpan * fromRatio,
    to: center + newSpan * (1 - fromRatio),
  })
  return true
}

/**
 * @param {HTMLElement} el
 * @param {import('lightweight-charts').IChartApi} chart
 * @param {import('lightweight-charts').ISeriesApi} mainSeries
 * @param {{ maxPlotLocalY?: number | (() => number | null), onUserZoom?: () => void, onReset?: () => void }} [opts]
 */
export function bindMarketChartPriceAxisZoom(el, chart, mainSeries, opts = {}) {
  const readMaxPlotY = () => {
    const v = typeof opts.maxPlotLocalY === 'function' ? opts.maxPlotLocalY() : opts.maxPlotLocalY
    return Number.isFinite(v) ? v : Infinity
  }
  const onUserZoom = typeof opts.onUserZoom === 'function' ? opts.onUserZoom : null
  const onReset = typeof opts.onReset === 'function' ? opts.onReset : null

  const readWidth = () => chart.priceScale('right').width() || 52

  const hit = (clientX, clientY) =>
    marketChartPriceAxisHit(clientX, clientY, el.getBoundingClientRect(), readWidth(), readMaxPlotY())

  let dragging = false
  let activePointerId = null
  let lastY = 0
  let anchorY = 0

  const applyZoom = (deltaPx, anchorClientY, mode) => {
    const hostRect = el.getBoundingClientRect()
    if (!zoomMarketChartPriceScale(mainSeries, deltaPx, anchorClientY, hostRect, mode)) return
    onUserZoom?.()
  }

  const onWheel = (e) => {
    if (!hit(e.clientX, e.clientY)) return
    e.preventDefault()
    e.stopPropagation()
    applyZoom(e.deltaY, e.clientY, 'wheel')
  }

  const onPointerDown = (e) => {
    if (!hit(e.clientX, e.clientY)) return
    if (e.button !== 0 && e.pointerType === 'mouse') return
    e.preventDefault()
    e.stopPropagation()
    dragging = true
    activePointerId = e.pointerId
    lastY = e.clientY
    anchorY = e.clientY
    el.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!dragging || e.pointerId !== activePointerId) return
    e.preventDefault()
    e.stopPropagation()
    const dy = e.clientY - lastY
    lastY = e.clientY
    applyZoom(dy, anchorY, 'drag')
  }

  const endDrag = (e) => {
    if (!dragging || e.pointerId !== activePointerId) return
    dragging = false
    activePointerId = null
    if (el.hasPointerCapture(e.pointerId)) {
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }
  }

  const onPointerMoveHover = (e) => {
    if (dragging) return
    el.style.cursor = hit(e.clientX, e.clientY) ? 'ns-resize' : ''
  }

  const onPointerLeave = () => {
    if (!dragging) el.style.cursor = ''
  }

  const onDblClick = (e) => {
    if (!hit(e.clientX, e.clientY)) return
    e.preventDefault()
    e.stopPropagation()
    onReset?.()
  }

  const capture = { capture: true }
  el.addEventListener('wheel', onWheel, { passive: false, capture: true })
  el.addEventListener('pointerdown', onPointerDown, capture)
  el.addEventListener('pointermove', onPointerMove, capture)
  el.addEventListener('pointerup', endDrag, capture)
  el.addEventListener('pointercancel', endDrag, capture)
  el.addEventListener('pointermove', onPointerMoveHover, capture)
  el.addEventListener('pointerleave', onPointerLeave, capture)
  el.addEventListener('dblclick', onDblClick, capture)

  return () => {
    el.style.cursor = ''
    el.removeEventListener('wheel', onWheel, { capture: true })
    el.removeEventListener('pointerdown', onPointerDown, capture)
    el.removeEventListener('pointermove', onPointerMove, capture)
    el.removeEventListener('pointerup', endDrag, capture)
    el.removeEventListener('pointercancel', endDrag, capture)
    el.removeEventListener('pointermove', onPointerMoveHover, capture)
    el.removeEventListener('pointerleave', onPointerLeave, capture)
    el.removeEventListener('dblclick', onDblClick, capture)
  }
}
