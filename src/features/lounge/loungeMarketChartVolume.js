/** Volume histogram pane for Advanced fullscreen market charts. */

import { HistogramSeries } from 'lightweight-charts'
import { loungeMarketBarsToSeries } from './loungeMarketChartTheme.js'
import { applyMarketChartSubPanePriceScale } from './loungeMarketChartViewMode.js'

/** Bottom strip height as a fraction of chart height. */
export const MARKET_CHART_VOLUME_PANE_FRACTION = 0.18

/**
 * @param {Array<{ t: number, c: number, v?: number }>} rawBars
 * @param {boolean} [isLight]
 */
export function loungeMarketBarsToVolumeSeries(rawBars, isLight = false) {
  const barPoints = loungeMarketBarsToSeries(rawBars)
  if (!barPoints.length) return []

  const upColor = isLight ? 'rgba(22, 163, 74, 0.55)' : 'rgba(34, 197, 94, 0.55)'
  const downColor = isLight ? 'rgba(220, 38, 38, 0.55)' : 'rgba(239, 68, 68, 0.55)'

  const volByTime = new Map()
  for (const bar of rawBars || []) {
    if (!Number.isFinite(bar?.t)) continue
    const t = Math.floor(bar.t > 1e12 ? bar.t / 1000 : bar.t)
    const v = Number(bar.v)
    if (Number.isFinite(v) && v >= 0) volByTime.set(t, v)
  }

  /** @type {Array<{ time: number, value: number, color: string }>} */
  const out = []
  for (let i = 0; i < barPoints.length; i += 1) {
    const { time, value } = barPoints[i]
    const prev = i > 0 ? barPoints[i - 1].value : value
    let vol = volByTime.get(time)
    if (!Number.isFinite(vol) || vol <= 0) {
      vol = Math.max(1, Math.abs(value - prev) * 10000)
    }
    out.push({
      time,
      value: vol,
      color: value >= prev ? upColor : downColor,
    })
  }
  return out
}

/**
 * @param {import('lightweight-charts').IChartApi} chart
 * @param {Array<{ t: number, c: number, v?: number }>} rawBars
 * @param {{ isLight?: boolean, paneIndex?: number }} [opts]
 */
export function attachMarketChartVolumePane(chart, rawBars, opts = {}) {
  const { isLight = false, paneIndex = 1 } = opts
  const data = loungeMarketBarsToVolumeSeries(rawBars, isLight)
  if (!data.length) return null

  const series = chart.addSeries(
    HistogramSeries,
    {
      priceLineVisible: false,
      lastValueVisible: true,
      priceFormat: { type: 'volume' },
    },
    paneIndex,
  )
  series.setData(data)
  applyMarketChartSubPanePriceScale(chart, paneIndex, isLight)
  return series
}
