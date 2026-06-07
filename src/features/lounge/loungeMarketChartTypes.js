/**
 * Modal chart display types (feed minis stay sparkline-only).
 */

import { AreaSeries, CandlestickSeries, LineSeries } from 'lightweight-charts'
import { loungeMarketBarsToSeries } from './loungeMarketChartTheme.js'
import { marketBarHasOhlc } from '../../utils/marketBarOhlc.js'

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

/** Real OHLC when present on bars; otherwise close-only → synthetic wickless candles. */
export function loungeMarketBarsToCandlestickSeries(bars) {
  if (!Array.isArray(bars) || !bars.length) return []

  const sorted = bars
    .filter((b) => Number.isFinite(b?.t) && Number.isFinite(b?.c))
    .map((b) => ({
      t: Math.floor(b.t > 1e12 ? b.t / 1000 : b.t),
      c: b.c,
      o: b.o,
      h: b.h,
      l: b.l,
    }))
    .sort((a, b) => a.t - b.t)

  /** @type {Array<{ time: number, open: number, high: number, low: number, close: number }>} */
  const out = []
  let prevClose = sorted[0]?.c

  for (const row of sorted) {
    const time = row.t
    const last = out[out.length - 1]
    if (last && last.time === time) {
      if (marketBarHasOhlc(row)) {
        last.open = row.o
        last.high = row.h
        last.low = row.l
        last.close = row.c
      } else {
        last.close = row.c
        last.high = Math.max(last.open, row.c)
        last.low = Math.min(last.open, row.c)
      }
      prevClose = row.c
      continue
    }

    if (marketBarHasOhlc(row)) {
      out.push({
        time,
        open: row.o,
        high: row.h,
        low: row.l,
        close: row.c,
      })
      prevClose = row.c
      continue
    }

    const close = row.c
    const open = prevClose == null ? close : prevClose
    out.push({
      time,
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
