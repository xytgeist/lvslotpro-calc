/**
 * Modal chart display types (feed minis stay sparkline-only).
 */

import { AreaSeries, CandlestickSeries, LineSeries } from 'lightweight-charts'
import { loungeMarketBarsToSeries } from './loungeMarketChartTheme.js'

export const LOUNGE_MARKET_CHART_TYPE_STORAGE_KEY = 'loungeMarketChartType:v1'

/** @typedef {'area' | 'line' | 'candle'} MarketModalChartTypeId */

/** @type {Array<{ id: MarketModalChartTypeId, label: string }>} */
export const MARKET_MODAL_CHART_TYPES = [
  { id: 'area', label: 'Area' },
  { id: 'candle', label: 'Candles' },
]

const CHART_TYPE_BY_ID = Object.fromEntries(MARKET_MODAL_CHART_TYPES.map((row) => [row.id, row]))

/** @returns {MarketModalChartTypeId} */
export function readStoredMarketChartType() {
  if (typeof window === 'undefined') return 'area'
  try {
    const raw = window.localStorage.getItem(LOUNGE_MARKET_CHART_TYPE_STORAGE_KEY)
    const id = String(raw || '').trim()
    if (id === 'line') return 'area'
    return CHART_TYPE_BY_ID[id] ? /** @type {MarketModalChartTypeId} */ (id) : 'area'
  } catch {
    return 'area'
  }
}

/** @param {MarketModalChartTypeId} chartType */
export function writeStoredMarketChartType(chartType) {
  if (typeof window === 'undefined') return
  if (!CHART_TYPE_BY_ID[chartType]) return
  try {
    window.localStorage.setItem(LOUNGE_MARKET_CHART_TYPE_STORAGE_KEY, chartType)
  } catch {
    /* ignore quota / private mode */
  }
}

/** @param {MarketModalChartTypeId | string} chartType */
export function marketModalChartTypeLabel(chartType) {
  return CHART_TYPE_BY_ID[chartType]?.label || 'Area'
}

/** Close-only bars → synthetic OHLC (open = prior close). */
export function loungeMarketBarsToCandlestickSeries(bars) {
  const line = loungeMarketBarsToSeries(bars)
  if (!line.length) return []

  /** @type {Array<{ time: number, open: number, high: number, low: number, close: number }>} */
  const out = []
  let prevClose = line[0].value
  for (let i = 0; i < line.length; i += 1) {
    const close = line[i].value
    const open = i === 0 ? close : prevClose
    out.push({
      time: line[i].time,
      open,
      high: Math.max(open, close),
      low: Math.min(open, close),
      close,
    })
    prevClose = close
  }
  return out
}

/**
 * @param {MarketModalChartTypeId | string} chartType
 * @param {Array<{ time: number, value: number }>} barPoints
 * @param {Array<{ t: number, c: number }>} [rawBars]
 */
export function marketModalChartHighLow(chartType, barPoints, rawBars = []) {
  if (chartType === 'candle') {
    const candles = loungeMarketBarsToCandlestickSeries(rawBars)
    let high = null
    let low = null
    for (const row of candles) {
      if (!Number.isFinite(row.high) || !Number.isFinite(row.low)) continue
      if (!high || row.high > high.value) high = { time: row.time, value: row.high }
      if (!low || row.low < low.value) low = { time: row.time, value: row.low }
    }
    return { high, low }
  }

  let high = null
  let low = null
  for (const point of barPoints || []) {
    const value = Number(point?.value)
    if (!Number.isFinite(value)) continue
    if (!high || value > high.value) high = { time: point.time, value }
    if (!low || value < low.value) low = { time: point.time, value }
  }
  return { high, low }
}

/**
 * @param {import('lightweight-charts').IChartApi} chart
 * @param {MarketModalChartTypeId | string} chartType
 * @param {{
 *   barPoints: Array<{ time: number, value: number }>,
 *   rawBars?: Array<{ t: number, c: number }>,
 *   lineColor: string,
 *   chartUp: boolean,
 *   isLight?: boolean,
 * }} opts
 */
export function attachModalMainChartSeries(chart, chartType, opts) {
  const { barPoints, rawBars = [], lineColor, chartUp, isLight = false } = opts
  const priceFormat = { type: 'price', precision: 2, minMove: 0.01 }
  const common = {
    priceLineVisible: false,
    lastValueVisible: false,
    priceFormat,
  }

  if (chartType === 'line') {
    const series = chart.addSeries(LineSeries, {
      color: lineColor,
      lineWidth: 2,
      ...common,
    })
    series.setData(barPoints)
    return series
  }

  if (chartType === 'candle') {
    const up = isLight ? '#16a34a' : '#22c55e'
    const down = isLight ? '#dc2626' : '#ef4444'
    const series = chart.addSeries(CandlestickSeries, {
      upColor: up,
      downColor: down,
      borderVisible: false,
      wickUpColor: up,
      wickDownColor: down,
      ...common,
    })
    series.setData(loungeMarketBarsToCandlestickSeries(rawBars))
    return series
  }

  const series = chart.addSeries(AreaSeries, {
    lineColor,
    topColor: chartUp ? 'rgba(34, 197, 94, 0.28)' : 'rgba(239, 68, 68, 0.28)',
    bottomColor: chartUp ? 'rgba(34, 197, 94, 0)' : 'rgba(239, 68, 68, 0)',
    lineWidth: 2,
    ...common,
  })
  if (isLight) {
    series.applyOptions({
      topColor: chartUp ? 'rgba(22, 163, 74, 0.22)' : 'rgba(220, 38, 38, 0.22)',
      bottomColor: chartUp ? 'rgba(22, 163, 74, 0)' : 'rgba(220, 38, 38, 0)',
    })
  }
  series.setData(barPoints)
  return series
}
