/**
 * Technical indicators for Lounge market modal charts (Lightweight Charts overlays / panes).
 * @typedef {{ time: number, value: number }} ChartPoint
 */

import { HistogramSeries, LineSeries, LineStyle } from 'lightweight-charts'
import { applyMarketChartSubPanePriceScale } from './loungeMarketChartViewMode.js'

/** @typedef {'overlay' | 'oscillator'} MarketChartIndicatorKind */

/**
 * @typedef {Object} MarketChartIndicatorDef
 * @property {string} id
 * @property {string} label
 * @property {MarketChartIndicatorKind} kind
 * @property {string} [color]
 */

export const LOUNGE_MARKET_CHART_INDICATORS_STORAGE_KEY = 'loungeMarketChartIndicators:v1'

/** Most common modal indicators — overlay MAs/BB + RSI/MACD oscillators. */
export const MARKET_CHART_INDICATORS = /** @type {MarketChartIndicatorDef[]} */ ([
  { id: 'sma20', label: 'SMA 20', kind: 'overlay', color: '#f59e0b' },
  { id: 'sma50', label: 'SMA 50', kind: 'overlay', color: '#3b82f6' },
  { id: 'sma200', label: 'SMA 200', kind: 'overlay', color: '#a855f7' },
  { id: 'ema9', label: 'EMA 9', kind: 'overlay', color: '#06b6d4' },
  { id: 'ema21', label: 'EMA 21', kind: 'overlay', color: '#ec4899' },
  { id: 'bb20', label: 'BB 20', kind: 'overlay', color: '#94a3b8' },
  { id: 'rsi14', label: 'RSI 14', kind: 'oscillator', color: '#c084fc' },
  { id: 'macd', label: 'MACD', kind: 'oscillator', color: '#38bdf8' },
])

const INDICATOR_BY_ID = Object.fromEntries(MARKET_CHART_INDICATORS.map((row) => [row.id, row]))

/** @returns {Set<string>} */
export function readStoredMarketChartIndicators() {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(LOUNGE_MARKET_CHART_INDICATORS_STORAGE_KEY)
    const parsed = JSON.parse(String(raw || '[]'))
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id) => typeof id === 'string' && INDICATOR_BY_ID[id]))
  } catch {
    return new Set()
  }
}

/** @param {Set<string>|string[]} active */
export function writeStoredMarketChartIndicators(active) {
  if (typeof window === 'undefined') return
  try {
    const ids = [...active].filter((id) => INDICATOR_BY_ID[id]).sort()
    window.localStorage.setItem(LOUNGE_MARKET_CHART_INDICATORS_STORAGE_KEY, JSON.stringify(ids))
  } catch {
    /* ignore quota / private mode */
  }
}

/** @param {ChartPoint[]} barPoints @param {number} period */
function computeSmaSeries(barPoints, period) {
  /** @type {ChartPoint[]} */
  const out = []
  if (!barPoints.length || period < 1) return out
  for (let i = period - 1; i < barPoints.length; i += 1) {
    let sum = 0
    for (let j = i - period + 1; j <= i; j += 1) sum += barPoints[j].value
    out.push({ time: barPoints[i].time, value: sum / period })
  }
  return out
}

/** @param {ChartPoint[]} barPoints @param {number} period */
function computeEmaSeries(barPoints, period) {
  /** @type {ChartPoint[]} */
  const out = []
  if (!barPoints.length || period < 1) return out
  const k = 2 / (period + 1)
  let ema = null
  for (let i = 0; i < barPoints.length; i += 1) {
    const v = barPoints[i].value
    if (ema == null) {
      if (i < period - 1) continue
      let sum = 0
      for (let j = i - period + 1; j <= i; j += 1) sum += barPoints[j].value
      ema = sum / period
    } else {
      ema = v * k + ema * (1 - k)
    }
    out.push({ time: barPoints[i].time, value: ema })
  }
  return out
}

/**
 * @param {ChartPoint[]} barPoints
 * @param {number} period
 * @param {number} stdDev
 */
function computeBollingerSeries(barPoints, period, stdDev) {
  const middle = computeSmaSeries(barPoints, period)
  /** @type {ChartPoint[]} */
  const upper = []
  /** @type {ChartPoint[]} */
  const lower = []
  if (!middle.length) return { middle, upper, lower }

  for (let i = period - 1; i < barPoints.length; i += 1) {
    const mid = middle[i - (period - 1)]
    if (!mid) continue
    let sumSq = 0
    for (let j = i - period + 1; j <= i; j += 1) {
      const d = barPoints[j].value - mid.value
      sumSq += d * d
    }
    const sd = Math.sqrt(sumSq / period)
    upper.push({ time: barPoints[i].time, value: mid.value + stdDev * sd })
    lower.push({ time: barPoints[i].time, value: mid.value - stdDev * sd })
  }
  return { middle, upper, lower }
}

/** @param {ChartPoint[]} barPoints @param {number} period */
function computeRsiSeries(barPoints, period) {
  /** @type {ChartPoint[]} */
  const out = []
  if (barPoints.length <= period) return out

  let avgGain = 0
  let avgLoss = 0
  for (let i = 1; i <= period; i += 1) {
    const change = barPoints[i].value - barPoints[i - 1].value
    if (change >= 0) avgGain += change
    else avgLoss -= change
  }
  avgGain /= period
  avgLoss /= period

  const rsiAt = (gain, loss) => {
    if (loss === 0) return gain === 0 ? 50 : 100
    const rs = gain / loss
    return 100 - 100 / (1 + rs)
  }

  out.push({ time: barPoints[period].time, value: rsiAt(avgGain, avgLoss) })

  for (let i = period + 1; i < barPoints.length; i += 1) {
    const change = barPoints[i].value - barPoints[i - 1].value
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? -change : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
    out.push({ time: barPoints[i].time, value: rsiAt(avgGain, avgLoss) })
  }
  return out
}

/** @param {ChartPoint[]} barPoints */
function computeMacdSeries(barPoints) {
  const fast = computeEmaSeries(barPoints, 12)
  const slow = computeEmaSeries(barPoints, 26)
  /** @type {ChartPoint[]} */
  const macdLine = []
  const slowByTime = new Map(slow.map((p) => [p.time, p.value]))
  for (const f of fast) {
    const s = slowByTime.get(f.time)
    if (s == null) continue
    macdLine.push({ time: f.time, value: f.value - s })
  }
  const signalLine = computeEmaSeries(macdLine, 9)
  const signalByTime = new Map(signalLine.map((p) => [p.time, p.value]))
  /** @type {ChartPoint[]} */
  const histogram = []
  for (const m of macdLine) {
    const sig = signalByTime.get(m.time)
    if (sig == null) continue
    histogram.push({ time: m.time, value: m.value - sig })
  }
  return { macdLine, signalLine, histogram }
}

/**
 * Precompute overlay line arrays for price-scale padding.
 * @param {ChartPoint[]} barPoints
 * @param {Set<string>|string[]} activeIds
 */
export function computeMarketChartOverlayLines(barPoints, activeIds) {
  const ids = new Set(activeIds)
  /** @type {ChartPoint[][]} */
  const lines = []
  if (!barPoints.length) return lines

  if (ids.has('sma20')) lines.push(computeSmaSeries(barPoints, 20))
  if (ids.has('sma50')) lines.push(computeSmaSeries(barPoints, 50))
  if (ids.has('sma200')) lines.push(computeSmaSeries(barPoints, 200))
  if (ids.has('ema9')) lines.push(computeEmaSeries(barPoints, 9))
  if (ids.has('ema21')) lines.push(computeEmaSeries(barPoints, 21))
  if (ids.has('bb20')) {
    const bb = computeBollingerSeries(barPoints, 20, 2)
    lines.push(bb.upper, bb.middle, bb.lower)
  }
  return lines
}

/**
 * Attach indicator series to an existing chart. Caller owns chart lifecycle.
 * @param {import('lightweight-charts').IChartApi} chart
 * @param {import('lightweight-charts').ISeriesApi} mainSeries
 * @param {ChartPoint[]} barPoints
 * @param {Set<string>|string[]} activeIds
 * @param {{ isLight?: boolean, panePlan?: import('./loungeMarketChartPanes.js').MarketChartPanePlan }} [opts]
 * @returns {import('lightweight-charts').ISeriesApi[]}
 */
export function attachMarketChartIndicators(chart, mainSeries, barPoints, activeIds, opts = {}) {
  const ids = new Set(activeIds)
  /** @type {import('lightweight-charts').ISeriesApi[]} */
  const created = []
  if (!barPoints.length) return created

  const oscPaneById = new Map((opts.panePlan?.oscillatorPanes ?? []).map((row) => [row.id, row.paneIndex]))
  const oscillatorCount = opts.panePlan?.oscillatorCount ?? 0

  const addOverlayLine = (data, color, lineWidth = 1, lineStyle = 0) => {
    if (!data.length) return
    const series = chart.addSeries(LineSeries, {
      color,
      lineWidth,
      lineStyle,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
      priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
    })
    series.setData(data)
    created.push(series)
  }

  if (ids.has('sma20')) addOverlayLine(computeSmaSeries(barPoints, 20), '#f59e0b', 1)
  if (ids.has('sma50')) addOverlayLine(computeSmaSeries(barPoints, 50), '#3b82f6', 1)
  if (ids.has('sma200')) addOverlayLine(computeSmaSeries(barPoints, 200), '#a855f7', 1)
  if (ids.has('ema9')) addOverlayLine(computeEmaSeries(barPoints, 9), '#06b6d4', 1)
  if (ids.has('ema21')) addOverlayLine(computeEmaSeries(barPoints, 21), '#ec4899', 1)
  if (ids.has('bb20')) {
    const bb = computeBollingerSeries(barPoints, 20, 2)
    addOverlayLine(bb.middle, '#94a3b8', 1)
    addOverlayLine(bb.upper, '#64748b', 1, 2)
    addOverlayLine(bb.lower, '#64748b', 1, 2)
  }


  if (ids.has('rsi14')) {
    const paneIndex = oscPaneById.get('rsi14') ?? 2
    const rsi = chart.addSeries(
      LineSeries,
      {
        color: '#c084fc',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: false,
        priceFormat: { type: 'price', precision: 0, minMove: 1 },
      },
      paneIndex,
    )
    rsi.setData(computeRsiSeries(barPoints, 14))
    created.push(rsi)
    applyMarketChartSubPanePriceScale(chart, paneIndex, opts.isLight)
    rsi.createPriceLine({
      price: 70,
      color: opts.isLight ? 'rgba(113, 113, 122, 0.35)' : 'rgba(161, 161, 170, 0.35)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      lineVisible: true,
      axisLabelVisible: true,
      title: '',
    })
    rsi.createPriceLine({
      price: 30,
      color: opts.isLight ? 'rgba(113, 113, 122, 0.35)' : 'rgba(161, 161, 170, 0.35)',
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      lineVisible: true,
      axisLabelVisible: true,
      title: '',
    })
  }

  if (ids.has('macd')) {
    const { macdLine, signalLine, histogram } = computeMacdSeries(barPoints)
    const paneIndex = oscPaneById.get('macd') ?? (oscillatorCount > 1 ? 3 : 2)
    const upColor = opts.isLight ? '#16a34a' : '#22c55e'
    const downColor = opts.isLight ? '#dc2626' : '#ef4444'
    const hist = chart.addSeries(
      HistogramSeries,
      {
        priceLineVisible: false,
        lastValueVisible: false,
        base: 0,
      },
      paneIndex,
    )
    hist.setData(
      histogram.map((p) => ({
        time: p.time,
        value: p.value,
        color: p.value >= 0 ? upColor : downColor,
      })),
    )
    created.push(hist)
    applyMarketChartSubPanePriceScale(chart, paneIndex, opts.isLight)
    const macd = chart.addSeries(
      LineSeries,
      {
        color: '#38bdf8',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: true,
        crosshairMarkerVisible: false,
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      },
      paneIndex,
    )
    macd.setData(macdLine)
    created.push(macd)
    const signal = chart.addSeries(
      LineSeries,
      {
        color: '#fb923c',
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        priceFormat: { type: 'price', precision: 2, minMove: 0.01 },
      },
      paneIndex,
    )
    signal.setData(signalLine)
    created.push(signal)
  }

  return created
}

/** @typedef {{ label: string, color: string, dashed?: boolean }} MarketIndicatorLegendItem */

/** Colors/lines drawn on chart for one indicator (for selector legend). */
export function marketIndicatorLegendItems(indId, isLight = false) {
  const upColor = isLight ? '#16a34a' : '#22c55e'
  const downColor = isLight ? '#dc2626' : '#ef4444'
  switch (indId) {
    case 'bb20':
      return /** @type {MarketIndicatorLegendItem[]} */ ([
        { label: 'Mid', color: '#94a3b8' },
        { label: 'Bands', color: '#64748b', dashed: true },
      ])
    case 'macd':
      return /** @type {MarketIndicatorLegendItem[]} */ ([
        { label: 'MACD', color: '#38bdf8' },
        { label: 'Signal', color: '#fb923c' },
        { label: 'Hist +', color: upColor },
        { label: 'Hist −', color: downColor },
      ])
    default: {
      const ind = INDICATOR_BY_ID[indId]
      if (!ind) return []
      return [{ label: ind.label, color: ind.color || '#94a3b8' }]
    }
  }
}

/** Flat legend rows for all active indicators (dropdown + on-chart legend). */
export function listActiveIndicatorLegend(activeIds, isLight = false) {
  const order = new Map(MARKET_CHART_INDICATORS.map((row, i) => [row.id, i]))
  const ids = [...activeIds].sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99))
  /** @type {Array<MarketIndicatorLegendItem & { key: string }>} */
  const out = []
  for (const id of ids) {
    const def = INDICATOR_BY_ID[id]
    if (!def) continue
    const items = marketIndicatorLegendItems(id, isLight)
    if (items.length === 1 && items[0].label === def.label) {
      out.push({ key: id, ...items[0] })
      continue
    }
    for (const item of items) {
      out.push({ key: `${id}-${item.label}`, label: `${def.label} ${item.label}`, ...item })
    }
  }
  return out
}
