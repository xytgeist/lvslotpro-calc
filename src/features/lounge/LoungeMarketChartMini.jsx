import { useEffect, useRef } from 'react'
import { createChart, LineSeries } from 'lightweight-charts'
import {
  formatMarketChangePct,
  formatMarketPrice,
  marketEmbedCacheKey,
  pickRollingMarketPayload,
} from '../../utils/loungeMarketCaptionParse.js'
import { loungeMarketBarsToSeries, loungeMarketChartTheme } from './loungeMarketChartTheme.js'
import { marketChartLocalizationBase } from './loungeMarketChartLocale.js'

/**
 * @param {{
 *   embed: object,
 *   rollingLive?: object | null,
 *   onOpen?: () => void,
 *   className?: string,
 * }} props
 */
const MINI_CHART_TAP_MOVE_PX = 12
const MINI_SPARKLINE_WIDTH_PX = 116
const MINI_SPARKLINE_HEIGHT_PX = 52

export default function LoungeMarketChartMini({ embed, rollingLive = null, onOpen, className = '' }) {
  const hostRef = useRef(null)
  const chartRef = useRef(null)
  const tapRef = useRef(/** @type {{ x: number, y: number, pointerId: number } | null} */ (null))

  const isRolling = embed?.kind === 'rolling'
  const rollingPayload = isRolling ? pickRollingMarketPayload(embed, rollingLive) : null
  const quote = isRolling ? rollingPayload?.quote : embed?.quote
  const bars = isRolling ? rollingPayload?.bars : embed?.bars
  const changePct = Number(quote?.change_pct)
  const up = Number.isFinite(changePct) ? changePct >= 0 : true
  const theme = loungeMarketChartTheme()
  const displaySymbol = String(embed?.display_symbol || '').trim().toUpperCase()
  const displayName = String(embed?.name || displaySymbol).trim() || displaySymbol

  useEffect(() => {
    const el = hostRef.current
    if (!el) return undefined
    const chart = createChart(el, {
      width: el.clientWidth || MINI_SPARKLINE_WIDTH_PX,
      height: MINI_SPARKLINE_HEIGHT_PX,
      layout: theme.layout,
      grid: theme.grid,
      localization: marketChartLocalizationBase(),
      rightPriceScale: { visible: false },
      leftPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: { vertLine: { visible: false }, horzLine: { visible: false } },
      handleScroll: false,
      handleScale: false,
    })
    const series = chart.addSeries(LineSeries, {
      color: up ? theme.upColor : theme.downColor,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    })
    series.setData(loungeMarketBarsToSeries(bars || []))
    chart.timeScale().fitContent()
    chartRef.current = chart

    const ro = new ResizeObserver(() => {
      if (!hostRef.current || !chartRef.current) return
      chartRef.current.applyOptions({ width: hostRef.current.clientWidth })
      chartRef.current.timeScale().fitContent()
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [embed?.symbol, embed?.kind, bars, up, theme])

  if (!embed?.display_symbol) return null

  const onCardPointerDown = (e) => {
    tapRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId }
  }

  const onCardPointerUp = (e) => {
    const start = tapRef.current
    tapRef.current = null
    if (!start || start.pointerId !== e.pointerId) return
    const dx = e.clientX - start.x
    const dy = e.clientY - start.y
    const distSq = dx * dx + dy * dy
    if (distSq > MINI_CHART_TAP_MOVE_PX * MINI_CHART_TAP_MOVE_PX) return
    if (Math.abs(dx) > Math.abs(dy)) return
    e.stopPropagation()
    onOpen?.()
  }

  const onCardPointerCancel = (e) => {
    if (tapRef.current?.pointerId === e.pointerId) tapRef.current = null
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onPointerDown={onCardPointerDown}
      onPointerUp={onCardPointerUp}
      onPointerCancel={onCardPointerCancel}
      onKeyDown={(e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return
        e.preventDefault()
        e.stopPropagation()
        onOpen?.()
      }}
      className={`relative flex h-[4.25rem] min-h-[4.25rem] shrink-0 snap-start items-center gap-2.5 overflow-hidden rounded-2xl border ${theme.cardBorder} bg-gradient-to-br from-zinc-900/95 via-zinc-950 to-zinc-900/90 px-3 py-2 text-left [touch-action:pan-x_pan-y] cursor-pointer active:opacity-90 [-webkit-tap-highlight-color:transparent] ${className}`}
      data-lounge-market-chart-mini
      aria-label={`Open ${displaySymbol} chart`}
    >
      {embed.logo_url ? (
        <img
          src={embed.logo_url}
          alt=""
          className="h-10 w-10 shrink-0 rounded-full border border-zinc-700/50 object-cover"
        />
      ) : (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700/50 bg-zinc-800/90 text-[11px] font-bold text-zinc-300"
          aria-hidden
        >
          {displaySymbol.slice(0, 2)}
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
        <div className={`truncate text-[15px] font-bold leading-tight ${theme.priceText}`}>{displayName}</div>
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0">
          <span className={`shrink-0 text-[13px] font-semibold tracking-wide ${theme.mutedText}`}>
            {displaySymbol}
          </span>
          <span className={`text-[13px] font-semibold tabular-nums ${theme.priceText}`}>
            {formatMarketPrice(quote?.price)}
          </span>
          <span
            className={`text-[13px] font-semibold tabular-nums ${up ? 'text-lv-green' : 'text-lv-red'}`}
          >
            {formatMarketChangePct(changePct)}
          </span>
        </div>
      </div>
      <div
        ref={hostRef}
        className="pointer-events-none h-[52px] w-[7.25rem] shrink-0 sm:w-[8rem]"
        aria-hidden
      />
    </div>
  )
}

export { marketEmbedCacheKey }
