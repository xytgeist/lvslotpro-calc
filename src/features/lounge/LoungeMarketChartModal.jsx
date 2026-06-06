import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AreaSeries, createChart } from 'lightweight-charts'
import { feedPostDisplayCaption } from '../../utils/communityFeedPost.js'
import {
  formatMarketCap,
  formatMarketChangeLine,
  formatMarketPrice,
  MARKET_MODAL_DEFAULT_TIMEFRAME_IDX,
  MARKET_MODAL_TIMEFRAMES,
} from '../../utils/loungeMarketCaptionParse.js'
import { loungeMarketModalNews, loungeMarketModalSeries } from '../../utils/loungeMarketApi.js'
import { loungeSearchCashtagPosts, LOUNGE_SEARCH_SORT } from './loungeSearchApi.js'
import { loungeMarketBarsToSeries, loungeMarketChartIsLight, loungeMarketChartTheme } from './loungeMarketChartTheme.js'

const SHEET_DISMISS_PX = 88
const SHEET_DISMISS_VEL = 0.45

function shouldIgnoreSheetDragTarget(target) {
  if (!(target instanceof Element)) return true
  return Boolean(target.closest('button, a, input, textarea, select, [data-market-sheet-no-drag]'))
}

function formatNewsAge(unixSec) {
  const ts = Number(unixSec)
  if (!Number.isFinite(ts) || ts <= 0) return ''
  const diffMs = Date.now() - ts * 1000
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 48) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatPostAge(createdAt) {
  if (!createdAt) return ''
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/**
 * @param {{
 *   open: boolean,
 *   embeds: object[],
 *   focusSymbol?: string | null,
 *   supabaseClient: import('@supabase/supabase-js').SupabaseClient,
 *   onClose: () => void,
 *   hydratePosts?: (rows: object[]) => Promise<object[]>,
 *   onOpenPost?: (post: object) => void,
 * }} props
 */
export default function LoungeMarketChartModal({
  open,
  embeds,
  focusSymbol = null,
  supabaseClient,
  onClose,
  hydratePosts,
  onOpenPost,
}) {
  const chartHostRef = useRef(null)
  const chartRef = useRef(null)
  const postsScrollRef = useRef(null)
  const sheetDragRef = useRef(null)
  const [sheetDragY, setSheetDragY] = useState(0)
  const [sheetDragging, setSheetDragging] = useState(false)
  const [sheetClosing, setSheetClosing] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [timeframeIdx, setTimeframeIdx] = useState(0)
  const [series, setSeries] = useState(/** @type {{ quote?: object, bars?: object[], window_label?: string } | null} */ (null))
  const [loading, setLoading] = useState(false)
  const [news, setNews] = useState(/** @type {object | null} */ (null))
  const [newsLoading, setNewsLoading] = useState(false)
  const [postSort, setPostSort] = useState(LOUNGE_SEARCH_SORT.ENGAGEMENT)
  const [posts, setPosts] = useState(/** @type {object[]} */ ([]))
  const [postsLoading, setPostsLoading] = useState(false)
  /** Crosshair scrub overrides header quote until pointer leaves the chart. */
  const [scrubQuote, setScrubQuote] = useState(/** @type {{ price: number, change?: number, change_pct?: number } | null} */ (null))

  const isLight = loungeMarketChartIsLight()
  const list = useMemo(() => (Array.isArray(embeds) ? embeds.filter(Boolean) : []), [embeds])
  const timeframe = MARKET_MODAL_TIMEFRAMES[timeframeIdx] || MARKET_MODAL_TIMEFRAMES[0]

  useEffect(() => {
    if (!open || !list.length) return
    const idx = focusSymbol
      ? Math.max(0, list.findIndex((e) => e.display_symbol === focusSymbol || e.symbol === focusSymbol))
      : 0
    setActiveIdx(idx >= 0 ? idx : 0)
    setTimeframeIdx(MARKET_MODAL_DEFAULT_TIMEFRAME_IDX >= 0 ? MARKET_MODAL_DEFAULT_TIMEFRAME_IDX : 0)
    setPostSort(LOUNGE_SEARCH_SORT.ENGAGEMENT)
  }, [open, focusSymbol, list])

  const active = list[activeIdx] || null

  const resetSheetDrag = useCallback(() => {
    sheetDragRef.current = null
    setSheetDragging(false)
    setSheetDragY(0)
  }, [])

  const dismissSheet = useCallback(() => {
    setSheetClosing(true)
    setSheetDragY(typeof window !== 'undefined' ? window.innerHeight : 800)
    window.setTimeout(() => {
      setSheetClosing(false)
      resetSheetDrag()
      onClose()
    }, 220)
  }, [onClose, resetSheetDrag])

  const canStartSheetDrag = useCallback((target) => {
    if (shouldIgnoreSheetDragTarget(target)) return false
    if (target instanceof Element && target.closest('[data-market-sheet-drag]')) return true
    const scroll = postsScrollRef.current
    if (scroll && scroll.contains(target) && scroll.scrollTop <= 0) return true
    return false
  }, [])

  const onSheetPointerDown = useCallback(
    (e) => {
      if (sheetClosing) return
      if (e.button !== 0 && e.pointerType === 'mouse') return
      if (!canStartSheetDrag(e.target)) return
      sheetDragRef.current = {
        pointerId: e.pointerId,
        startY: e.clientY,
        startMs: Date.now(),
      }
      setSheetDragging(true)
      setSheetDragY(0)
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [canStartSheetDrag, sheetClosing],
  )

  const onSheetPointerMove = useCallback((e) => {
    const drag = sheetDragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const dy = Math.max(0, e.clientY - drag.startY)
    if (dy <= 0) return
    e.preventDefault()
    setSheetDragY(dy)
  }, [])

  const onSheetPointerEnd = useCallback(
    (e) => {
      const drag = sheetDragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      const dy = Math.max(0, e.clientY - drag.startY)
      const dt = Math.max(1, Date.now() - drag.startMs)
      const vel = dy / dt
      sheetDragRef.current = null
      setSheetDragging(false)
      if (dy >= SHEET_DISMISS_PX || vel >= SHEET_DISMISS_VEL) {
        dismissSheet()
        return
      }
      setSheetDragY(0)
    },
    [dismissSheet],
  )

  const onSheetPointerCancel = useCallback((e) => {
    if (sheetDragRef.current?.pointerId === e.pointerId) resetSheetDrag()
  }, [resetSheetDrag])

  useEffect(() => {
    if (!open) resetSheetDrag()
  }, [open, resetSheetDrag])

  const loadSeries = useCallback(async () => {
    if (!open || !active || !supabaseClient) return
    setLoading(true)
    try {
      const tf = MARKET_MODAL_TIMEFRAMES[timeframeIdx] || MARKET_MODAL_TIMEFRAMES[0]
      const embedCurrency = String(active.currency || 'USD').trim().toUpperCase() || 'USD'
      if (
        embedCurrency === 'USD' &&
        tf.kind === 'historical' &&
        active.kind === 'historical' &&
        active.bars?.length &&
        tf.windowKey === active.window_key
      ) {
        setSeries({
          quote: active.quote,
          bars: active.bars,
          window_label: active.window_label,
        })
        return
      }
      const data = await loungeMarketModalSeries(supabaseClient, {
        symbol: active.symbol,
        asset_class: active.asset_class,
        kind: tf.kind,
        window_key: tf.windowKey,
      })
      if (data) {
        setSeries({
          quote: data.quote,
          bars: data.bars,
          window_label: data.window_label,
        })
      }
    } finally {
      setLoading(false)
    }
  }, [active, open, supabaseClient, timeframeIdx])

  useEffect(() => {
    void loadSeries()
    if (!open || timeframe.kind !== 'rolling') return undefined
    const id = window.setInterval(() => void loadSeries(), 60_000)
    return () => window.clearInterval(id)
  }, [loadSeries, open, timeframe.kind])

  useEffect(() => {
    if (!open || !active || !supabaseClient) {
      setNews(null)
      return undefined
    }
    let cancelled = false
    setNewsLoading(true)
    void loungeMarketModalNews(supabaseClient, {
      symbol: active.symbol,
      asset_class: active.asset_class,
    })
      .then((row) => {
        if (!cancelled) setNews(row)
      })
      .finally(() => {
        if (!cancelled) setNewsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [active?.asset_class, active?.symbol, open, supabaseClient])

  const cashtag = active?.display_symbol ? String(active.display_symbol).trim().toUpperCase() : ''

  useEffect(() => {
    if (!open || !supabaseClient || !cashtag) {
      setPosts([])
      return undefined
    }
    let cancelled = false
    setPostsLoading(true)
    void loungeSearchCashtagPosts(supabaseClient, cashtag, {
      sort: postSort,
      limit: 12,
    })
      .then(async (result) => {
        if (cancelled) return
        const raw = Array.isArray(result.posts) ? result.posts : []
        const hydrated = hydratePosts ? await hydratePosts(raw) : raw
        if (!cancelled) setPosts(hydrated)
      })
      .catch(() => {
        if (!cancelled) setPosts([])
      })
      .finally(() => {
        if (!cancelled) setPostsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cashtag, hydratePosts, open, postSort, supabaseClient])

  useEffect(() => {
    setScrubQuote(null)
  }, [activeIdx, timeframeIdx, series])

  useEffect(() => {
    if (!open) setScrubQuote(null)
  }, [open])

  const quote = series?.quote || active?.quote
  const displayQuote = scrubQuote ?? quote
  const displayChangePct = Number(displayQuote?.change_pct)
  const displayUp = Number.isFinite(displayChangePct) ? displayChangePct >= 0 : true
  const chartChangePct = Number(quote?.change_pct)
  const chartUp = Number.isFinite(chartChangePct) ? chartChangePct >= 0 : true
  const theme = loungeMarketChartTheme(isLight)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') dismissSheet()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [dismissSheet, open])

  useEffect(() => {
    const el = chartHostRef.current
    if (!open || !el) return undefined
    const lineColor = chartUp ? theme.upColor : theme.downColor
    const chart = createChart(el, {
      width: el.clientWidth,
      height: el.clientHeight,
      layout: theme.layout,
      grid: theme.grid,
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.08, bottom: 0.22 } },
      timeScale: { visible: false, borderVisible: false },
      crosshair: { vertLine: { labelVisible: false }, horzLine: { labelVisible: false } },
    })
    const area = chart.addSeries(AreaSeries, {
      lineColor,
      topColor: chartUp ? 'rgba(34, 197, 94, 0.28)' : 'rgba(239, 68, 68, 0.28)',
      bottomColor: chartUp ? 'rgba(34, 197, 94, 0)' : 'rgba(239, 68, 68, 0)',
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    })
    if (isLight) {
      area.applyOptions({
        topColor: chartUp ? 'rgba(22, 163, 74, 0.22)' : 'rgba(220, 38, 38, 0.22)',
        bottomColor: chartUp ? 'rgba(22, 163, 74, 0)' : 'rgba(220, 38, 38, 0)',
      })
    }
    const barPoints = loungeMarketBarsToSeries(series?.bars || active?.bars || [])
    area.setData(barPoints)
    chart.timeScale().fitContent()

    const firstPrice = barPoints[0]?.value

    chart.subscribeCrosshairMove((param) => {
      if (!param.point || param.time == null) {
        setScrubQuote(null)
        return
      }
      const hit = param.seriesData.get(area)
      const price = Number(hit?.value)
      if (!Number.isFinite(price)) {
        setScrubQuote(null)
        return
      }
      if (Number.isFinite(firstPrice) && firstPrice > 0) {
        const change = price - firstPrice
        setScrubQuote({
          price,
          change,
          change_pct: (change / firstPrice) * 100,
        })
        return
      }
      setScrubQuote({ price })
    })

    chartRef.current = chart
    const ro = new ResizeObserver(() => {
      if (!chartHostRef.current || !chartRef.current) return
      chartRef.current.applyOptions({
        width: chartHostRef.current.clientWidth,
        height: chartHostRef.current.clientHeight,
      })
      chartRef.current.timeScale().fitContent()
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
    }
  }, [open, active, series, chartUp, theme, isLight])

  if (!open || !list.length) return null

  const shellClass = isLight
    ? 'border-zinc-200/90 bg-white text-zinc-900'
    : 'border-zinc-700/80 bg-zinc-950 text-zinc-50'
  const mutedClass = isLight ? 'text-zinc-500' : 'text-zinc-400'
  const borderClass = isLight ? 'border-zinc-200' : 'border-zinc-800'
  const pillIdleClass = isLight
    ? 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
    : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
  const pillActiveClass = isLight ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-700 text-zinc-50'
  const chartPillIdleClass = isLight
    ? 'bg-white/80 text-zinc-600 backdrop-blur-[2px] hover:bg-white/95'
    : 'bg-zinc-900/70 text-zinc-300 backdrop-blur-[2px] hover:bg-zinc-800/80'
  const chartPillActiveClass = isLight
    ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/80'
    : 'bg-zinc-700/95 text-zinc-50 shadow-sm'
  const tabActiveClass = isLight ? 'border-zinc-900 text-zinc-900' : 'border-cyan-400 text-zinc-50'
  const tabIdleClass = isLight ? 'border-transparent text-zinc-500' : 'border-transparent text-zinc-500'
  const backdropOpacity = sheetClosing ? 0 : Math.max(0, 0.55 - sheetDragY / 700)
  const sheetTransform = sheetClosing || sheetDragY > 0 ? `translate3d(0, ${sheetDragY}px, 0)` : undefined
  const sheetTransition =
    sheetClosing || (!sheetDragging && sheetDragY === 0) ? 'transform 0.22s ease' : 'none'

  return createPortal(
    <div
      className="fixed inset-0 z-[105] flex flex-col justify-end backdrop-blur-[2px] transition-[background-color] duration-200 motion-reduce:transition-none"
      style={{ backgroundColor: `rgba(0,0,0,${backdropOpacity})` }}
      role="dialog"
      aria-modal="true"
      aria-label={`${active?.display_symbol || 'Market'} chart`}
    >
      <div className="absolute inset-0 cursor-default" aria-hidden />
      <div
        className={`relative z-10 flex h-[85dvh] max-h-[85dvh] shrink-0 flex-col rounded-t-3xl border border-b-0 shadow-2xl will-change-transform motion-reduce:transition-none ${shellClass} ${
          sheetDragging ? 'touch-none' : ''
        }`}
        style={{ transform: sheetTransform, transition: sheetTransition }}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={onSheetPointerDown}
        onPointerMove={onSheetPointerMove}
        onPointerUp={onSheetPointerEnd}
        onPointerCancel={onSheetPointerCancel}
      >
        <div
          className={`flex shrink-0 justify-center px-4 pb-2 pt-3 ${borderClass}`}
          data-market-sheet-drag
        >
          <div className="h-1 w-10 rounded-full bg-zinc-500/35" aria-hidden />
        </div>

        <div className="shrink-0 px-4 pb-3 pt-0" data-market-sheet-drag>
          <div className="flex items-start gap-3">
            {active?.logo_url ? (
              <img src={active.logo_url} alt="" className="mt-0.5 h-10 w-10 shrink-0 rounded-full object-cover" />
            ) : (
              <div
                className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isLight ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {(active?.display_symbol || '?').slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-[17px] font-bold leading-tight">{active?.name || active?.display_symbol}</div>
              <div className={`min-h-[2.75rem] truncate text-[13px] leading-snug ${mutedClass}`}>
                ${active?.display_symbol}
                {active?.market_cap != null ? ` · ${formatMarketCap(active.market_cap)} MC` : ''}
              </div>
            </div>
          </div>

          <div className="mt-3 text-[28px] font-bold leading-none tabular-nums tracking-tight">
            {formatMarketPrice(displayQuote?.price)}
          </div>
          <div className={`mt-1 text-[15px] font-semibold tabular-nums ${displayUp ? 'text-lv-green' : 'text-lv-red'}`}>
            {formatMarketChangeLine(displayQuote?.change, displayChangePct)}
          </div>
        </div>

        {list.length > 1 ? (
          <div className={`flex min-h-[2.25rem] shrink-0 gap-2 overflow-x-auto px-4 pb-2 ${borderClass}`}>
            {list.map((embed, i) => (
              <button
                key={`${embed.symbol}-${embed.kind}`}
                type="button"
                onClick={() => {
                  setActiveIdx(i)
                  setTimeframeIdx(MARKET_MODAL_DEFAULT_TIMEFRAME_IDX >= 0 ? MARKET_MODAL_DEFAULT_TIMEFRAME_IDX : 0)
                }}
                className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold touch-manipulation ${
                  i === activeIdx ? 'bg-cyan-500/20 text-cyan-300' : pillIdleClass
                }`}
              >
                ${embed.display_symbol}
              </button>
            ))}
          </div>
        ) : null}

        <div className="relative mx-4 h-[220px] shrink-0 overflow-hidden rounded-xl" data-market-sheet-no-drag>
          {loading ? (
            <div className={`absolute inset-0 z-[1] grid place-items-center text-sm ${mutedClass}`}>Loading…</div>
          ) : null}
          <div ref={chartHostRef} className="absolute inset-0" />
          <div className="absolute inset-x-2 bottom-2 z-10 grid grid-cols-6 gap-1" data-market-sheet-no-drag>
            {MARKET_MODAL_TIMEFRAMES.map((tf, i) => (
              <button
                key={tf.label}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setTimeframeIdx(i)
                }}
                className={`min-w-0 rounded-full py-1.5 text-center text-[11px] font-semibold leading-none touch-manipulation ${
                  i === timeframeIdx ? chartPillActiveClass : chartPillIdleClass
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`min-h-[5.5rem] shrink-0 border-t px-4 py-3 ${borderClass}`} data-market-sheet-drag>
          {newsLoading ? (
            <div className={`text-[13px] ${mutedClass}`}>Loading latest news…</div>
          ) : news?.headline ? (
            news.url ? (
              <a
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group block touch-manipulation ${isLight ? 'hover:text-zinc-700' : 'hover:text-zinc-200'}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={`text-[11px] font-semibold uppercase tracking-wide ${mutedClass}`}>Latest</div>
                <div className="mt-0.5 line-clamp-2 text-[14px] font-medium leading-snug group-hover:underline">
                  {news.headline}
                </div>
                <div className={`mt-1 text-[12px] ${mutedClass}`}>
                  {[news.source, formatNewsAge(news.datetime)].filter(Boolean).join(' · ')}
                </div>
              </a>
            ) : (
              <div>
                <div className={`text-[11px] font-semibold uppercase tracking-wide ${mutedClass}`}>Latest</div>
                <div className="mt-0.5 line-clamp-2 text-[14px] font-medium leading-snug">{news.headline}</div>
                <div className={`mt-1 text-[12px] ${mutedClass}`}>
                  {[news.source, formatNewsAge(news.datetime)].filter(Boolean).join(' · ')}
                </div>
              </div>
            )
          ) : (
            <div className={`text-[13px] ${mutedClass}`}>No recent headlines for ${active?.display_symbol}.</div>
          )}
        </div>

        <div className={`flex shrink-0 gap-6 border-b px-4 ${borderClass}`} data-market-sheet-drag>
          {[
            { id: LOUNGE_SEARCH_SORT.ENGAGEMENT, label: 'Top' },
            { id: LOUNGE_SEARCH_SORT.RECENT, label: 'Latest' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPostSort(tab.id)}
              className={`-mb-px border-b-2 pb-2.5 pt-1 text-[15px] font-semibold touch-manipulation ${
                postSort === tab.id ? tabActiveClass : tabIdleClass
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))]" ref={postsScrollRef}>
          {postsLoading ? (
            <div className={`py-8 text-center text-sm ${mutedClass}`}>Loading posts…</div>
          ) : posts.length === 0 ? (
            <div className={`py-8 text-center text-sm ${mutedClass}`}>
              No Lounge posts mentioning ${active?.display_symbol} yet.
            </div>
          ) : (
            <ul className={`divide-y ${borderClass}`}>
              {posts.map((post) => {
                const profile = post.author_profile
                const caption = feedPostDisplayCaption(post)
                return (
                  <li key={post.id}>
                    <button
                      type="button"
                      className={`flex w-full gap-3 py-3 text-left touch-manipulation active:opacity-90 ${
                        isLight ? 'hover:bg-zinc-50' : 'hover:bg-zinc-900/60'
                      }`}
                      onClick={() => {
                        onOpenPost?.(post)
                        dismissSheet()
                      }}
                    >
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isLight ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          {(profile?.display_name || profile?.handle || '?').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                          <span className="truncate text-[14px] font-bold">
                            {profile?.display_name || profile?.handle || 'Member'}
                          </span>
                          {profile?.handle ? (
                            <span className={`truncate text-[13px] ${mutedClass}`}>@{profile.handle}</span>
                          ) : null}
                          <span className={`text-[13px] ${mutedClass}`}>· {formatPostAge(post.created_at)}</span>
                        </div>
                        {caption ? (
                          <p className={`mt-1 line-clamp-3 whitespace-pre-wrap break-words text-[14px] leading-snug ${mutedClass}`}>
                            {caption}
                          </p>
                        ) : null}
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
