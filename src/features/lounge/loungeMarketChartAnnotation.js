/** Advanced chart ink overlay (pen + text) — normalized coords, merged at snapshot time. */

export const MARKET_CHART_ANNOTATION_PEN_COLOR = '#22d3ee'
export const MARKET_CHART_ANNOTATION_PEN_WIDTH = 2.75
export const MARKET_CHART_ANNOTATION_TEXT_COLOR = '#fafafa'
export const MARKET_CHART_ANNOTATION_TEXT_STROKE = '#09090b'

/** @typedef {{ type: 'stroke', color: string, width: number, points: Array<{ nx: number, ny: number }> }} MarketChartAnnotationStroke */
/** @typedef {{ type: 'text', nx: number, ny: number, text: string }} MarketChartAnnotationText */
/** @typedef {MarketChartAnnotationStroke | MarketChartAnnotationText} MarketChartAnnotationItem */

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {MarketChartAnnotationItem[]} items
 * @param {number} width
 * @param {number} height
 */
export function renderMarketChartAnnotations(ctx, items, width, height) {
  if (!ctx || !width || !height) return
  for (const item of items || []) {
    if (item.type === 'stroke') {
      const points = item.points || []
      if (points.length < 2) continue
      ctx.save()
      ctx.strokeStyle = item.color || MARKET_CHART_ANNOTATION_PEN_COLOR
      ctx.lineWidth = item.width || MARKET_CHART_ANNOTATION_PEN_WIDTH
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(points[0].nx * width, points[0].ny * height)
      for (let i = 1; i < points.length; i += 1) {
        ctx.lineTo(points[i].nx * width, points[i].ny * height)
      }
      ctx.stroke()
      ctx.restore()
      continue
    }
    if (item.type === 'text') {
      const text = String(item.text || '').trim()
      if (!text) continue
      const x = item.nx * width
      const y = item.ny * height
      const fontSize = Math.max(12, Math.round(Math.min(width, height) * 0.028))
      ctx.save()
      ctx.font = `600 ${fontSize}px system-ui, -apple-system, "Segoe UI", sans-serif`
      ctx.textBaseline = 'top'
      ctx.lineWidth = Math.max(2, fontSize * 0.14)
      ctx.strokeStyle = MARKET_CHART_ANNOTATION_TEXT_STROKE
      ctx.fillStyle = MARKET_CHART_ANNOTATION_TEXT_COLOR
      ctx.strokeText(text, x, y)
      ctx.fillText(text, x, y)
      ctx.restore()
    }
  }
}

/**
 * @param {MarketChartAnnotationItem[]} items
 * @param {number} width
 * @param {number} height
 */
export function exportMarketChartAnnotationCanvas(items, width, height) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const ctx = canvas.getContext('2d')
  if (!ctx) return canvas
  renderMarketChartAnnotations(ctx, items, canvas.width, canvas.height)
  return canvas
}

/**
 * @param {HTMLCanvasElement} targetCanvas
 * @param {HTMLCanvasElement | null | undefined} annotationCanvas
 */
export function mergeAnnotationLayerOntoCanvas(targetCanvas, annotationCanvas) {
  if (!annotationCanvas?.width || !annotationCanvas?.height) return targetCanvas
  const ctx = targetCanvas.getContext('2d')
  if (!ctx) return targetCanvas
  ctx.drawImage(annotationCanvas, 0, 0, targetCanvas.width, targetCanvas.height)
  return targetCanvas
}

/** @param {MarketChartAnnotationItem[]} items */
export function marketChartAnnotationHasInk(items) {
  return Array.isArray(items) && items.some((row) => {
    if (row.type === 'text') return String(row.text || '').trim().length > 0
    if (row.type === 'stroke') return (row.points || []).length >= 2
    return false
  })
}
