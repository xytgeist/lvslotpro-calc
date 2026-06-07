/**
 * Advanced chart resolution fetch — bar-count windows + pan-back chunks (not modal timeframe pills).
 */

import { aggregateMarketBarsToBucketSec } from './marketBarOhlc.ts'
import { coingeckoCryptoCandlesForAdvanced } from './coingeckoMarket.ts'
import {
  fetchFinnhubCandlesAtResolution,
  finnhubSymbolForAsset,
  normalizeMarketBars,
  type MarketAssetClass,
  type MarketBar,
} from './finnhubMarket.ts'
import { isUsableStockIntradayBars, regularSessionDaysBack } from './usEquityMarketSession.ts'
import { yahooStockCandles } from './yahooMarket.ts'

export type MarketChartResolutionId = '1' | '5' | '15' | '60' | '120' | '240' | 'D' | 'W'

export type MarketChartResolutionConfig = {
  id: MarketChartResolutionId
  label: string
  finnhubResolution: string
  bucketSec?: number
  barSec: number
  initialBars: number
  chunkBars: number
  maxLookbackDays: number
}

export const MARKET_CHART_RESOLUTIONS: MarketChartResolutionConfig[] = [
  { id: '1', label: '1m', finnhubResolution: '1', barSec: 60, initialBars: 390, chunkBars: 200, maxLookbackDays: 30 },
  { id: '5', label: '5m', finnhubResolution: '5', barSec: 300, initialBars: 350, chunkBars: 200, maxLookbackDays: 30 },
  { id: '15', label: '15m', finnhubResolution: '15', barSec: 900, initialBars: 280, chunkBars: 200, maxLookbackDays: 90 },
  { id: '60', label: '1H', finnhubResolution: '60', barSec: 3600, initialBars: 400, chunkBars: 200, maxLookbackDays: 730 },
  { id: '120', label: '2H', finnhubResolution: '60', bucketSec: 7200, barSec: 7200, initialBars: 400, chunkBars: 200, maxLookbackDays: 730 },
  { id: '240', label: '4H', finnhubResolution: '60', bucketSec: 14400, barSec: 14400, initialBars: 400, chunkBars: 200, maxLookbackDays: 730 },
  { id: 'D', label: 'Daily', finnhubResolution: 'D', barSec: 86400, initialBars: 280, chunkBars: 200, maxLookbackDays: 730 },
  { id: 'W', label: 'Weekly', finnhubResolution: 'W', barSec: 604800, initialBars: 110, chunkBars: 200, maxLookbackDays: 730 },
]

export const DEFAULT_MARKET_CHART_RESOLUTION_ID: MarketChartResolutionId = 'D'

const RESOLUTION_BY_ID = Object.fromEntries(
  MARKET_CHART_RESOLUTIONS.map((row) => [row.id, row]),
) as Record<string, MarketChartResolutionConfig>

const STOCK_RTH_RESOLUTIONS = new Set<MarketChartResolutionId>(['1', '5', '15'])
const YAHOO_RESOLUTION_MAX_BARS = 500
const MAX_YAHOO_FALLBACK_BARS = 500

export function getMarketChartResolution(id: string): MarketChartResolutionConfig {
  const key = String(id || '').trim()
  if (key === '30') return RESOLUTION_BY_ID['15']
  return RESOLUTION_BY_ID[key] || RESOLUTION_BY_ID[DEFAULT_MARKET_CHART_RESOLUTION_ID]
}

function barUnixSec(t: number): number {
  return Math.floor(t > 1e12 ? t / 1000 : t)
}

function yahooIntervalForResolution(config: MarketChartResolutionConfig): string {
  switch (config.id) {
    case '1':
      return '1m'
    case '5':
      return '5m'
    case '15':
      return '15m'
    case '60':
    case '120':
    case '240':
      return '1h'
    case 'D':
      return '1d'
    case 'W':
      return '1wk'
    default:
      return '1d'
  }
}

function aggregateBarsToBucket(bars: MarketBar[], bucketSec: number): MarketBar[] {
  const normalized = bars.map((bar) => ({ ...bar, t: barUnixSec(bar.t) }))
  return aggregateMarketBarsToBucketSec(normalized, bucketSec)
}

function takeLastBars(bars: MarketBar[], limit: number): MarketBar[] {
  if (bars.length <= limit) return bars
  return bars.slice(-limit)
}

function mergeBarsUnique(existing: MarketBar[], older: MarketBar[]): MarketBar[] {
  const map = new Map<number, MarketBar>()
  for (const bar of [...older, ...existing]) {
    if (!Number.isFinite(bar?.t) || !Number.isFinite(bar?.c)) continue
    map.set(barUnixSec(bar.t), bar)
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, bar]) => bar)
}

function fetchSpanSec(config: MarketChartResolutionConfig, barLimit: number): number {
  const sourceMultiplier = config.bucketSec ? Math.ceil(config.bucketSec / 3600) : 1
  const pad = config.bucketSec ? 24 : 12
  return config.barSec * (barLimit * sourceMultiplier + pad)
}

function isUsableStockSessionBars(config: MarketChartResolutionConfig, bars: MarketBar[]): boolean {
  if (bars.length < 2) return false
  if (config.id === '1' || config.id === '5') return isUsableStockIntradayBars(bars)
  return bars.length >= 4
}

async function fetchStockRthSessionBars(
  symbol: string,
  config: MarketChartResolutionConfig,
  fromSec: number,
  toSec: number,
): Promise<MarketBar[]> {
  const interval = yahooIntervalForResolution(config)
  const raw = await yahooStockCandles(
    symbol,
    fromSec,
    toSec,
    interval,
    YAHOO_RESOLUTION_MAX_BARS,
  )
  return normalizeMarketBars(raw).filter((b) => {
    const t = barUnixSec(b.t)
    return t >= fromSec && t <= toSec
  })
}

/** US equities 1m–15m: Yahoo RTH sessions (Finnhub free tier truncates 1m). */
async function resolveStockRthSeriesByResolution(
  symbol: string,
  config: MarketChartResolutionConfig,
  limit: number,
  minFromSec: number,
): Promise<{ bars: MarketBar[]; hasMore: boolean }> {
  const maxSessions = Math.min(40, config.maxLookbackDays + 5)

  if (config.id === '1') {
    for (const session of regularSessionDaysBack(undefined, maxSessions)) {
      const fromSec = Math.max(session.fromSec, minFromSec)
      const toSec = session.toSec + 60
      if (fromSec >= toSec) continue

      const sessionBars = await fetchStockRthSessionBars(symbol, config, fromSec, toSec)
      if (!isUsableStockSessionBars(config, sessionBars)) continue

      const bars = takeLastBars(sessionBars, limit)
      return { bars, hasMore: session.fromSec > minFromSec }
    }
    return { bars: [], hasMore: false }
  }

  let merged: MarketBar[] = []
  for (const session of regularSessionDaysBack(undefined, maxSessions)) {
    const fromSec = Math.max(session.fromSec, minFromSec)
    const toSec = session.toSec + 60
    if (fromSec >= toSec) continue

    const sessionBars = await fetchStockRthSessionBars(symbol, config, fromSec, toSec)
    if (!isUsableStockSessionBars(config, sessionBars)) continue
    merged = mergeBarsUnique(merged, sessionBars)
    if (merged.length >= limit) break
    if (session.fromSec <= minFromSec) break
  }

  const bars = takeLastBars(merged, limit)
  const hasMore = bars.length >= 2 && barUnixSec(bars[0].t) > minFromSec
  return { bars, hasMore }
}

async function resolveStockRthBarsBeforeByResolution(
  symbol: string,
  config: MarketChartResolutionConfig,
  anchor: number,
  limit: number,
  minFromSec: number,
): Promise<{ bars: MarketBar[]; hasMore: boolean }> {
  let merged: MarketBar[] = []
  const maxSessions = Math.min(40, config.maxLookbackDays + 5)
  let oldestSessionFrom = Number.POSITIVE_INFINITY

  for (const session of regularSessionDaysBack(undefined, maxSessions)) {
    if (session.toSec >= anchor) continue
    if (session.fromSec < minFromSec) break

    oldestSessionFrom = Math.min(oldestSessionFrom, session.fromSec)
    const fromSec = Math.max(session.fromSec, minFromSec)
    const toSec = Math.min(session.toSec + 60, anchor - 1)
    if (fromSec >= toSec) continue

    const sessionBars = await fetchStockRthSessionBars(symbol, config, fromSec, toSec)
    const clipped = sessionBars.filter((b) => barUnixSec(b.t) < anchor)
    if (!isUsableStockSessionBars(config, clipped)) continue
    merged = mergeBarsUnique(merged, clipped)
    if (merged.length >= limit) break
  }

  const bars = takeLastBars(merged, limit)
  const hasMore =
    bars.length >= 2 &&
    barUnixSec(bars[0].t) > minFromSec &&
    Number.isFinite(oldestSessionFrom) &&
    oldestSessionFrom > minFromSec
  return { bars, hasMore }
}

async function fetchRawBarsForWindow(
  symbol: string,
  assetClass: MarketAssetClass,
  config: MarketChartResolutionConfig,
  fromSec: number,
  toSec: number,
): Promise<MarketBar[]> {
  if (assetClass === 'stock' && STOCK_RTH_RESOLUTIONS.has(config.id)) {
    return fetchStockRthSessionBars(symbol, config, fromSec, toSec)
  }

  const finnhubSym = finnhubSymbolForAsset(symbol, assetClass)
  let bars = await fetchFinnhubCandlesAtResolution(
    finnhubSym,
    assetClass,
    fromSec,
    toSec,
    config.finnhubResolution,
  )

  const yahooMax = assetClass === 'stock' ? YAHOO_RESOLUTION_MAX_BARS : MAX_YAHOO_FALLBACK_BARS
  if (bars.length < 2 && assetClass === 'stock') {
    bars = await yahooStockCandles(
      symbol,
      fromSec,
      toSec,
      yahooIntervalForResolution(config),
      yahooMax,
    )
  }
  if (bars.length < 2 && assetClass === 'crypto') {
    const lookbackDays = Math.min(config.maxLookbackDays, Math.max(1, Math.ceil((toSec - fromSec) / 86400) + 2))
    bars = await coingeckoCryptoCandlesForAdvanced(symbol, lookbackDays, 500)
  }

  bars = normalizeMarketBars(bars)
  if (config.bucketSec) {
    bars = aggregateBarsToBucket(bars, config.bucketSec)
  }
  return bars.filter((b) => {
    const t = barUnixSec(b.t)
    return t >= fromSec && t <= toSec
  })
}

function clipBarsBefore(bars: MarketBar[], beforeSec: number): MarketBar[] {
  const anchor = Math.floor(beforeSec)
  return bars.filter((b) => barUnixSec(b.t) < anchor)
}

export async function resolveMarketSeriesByResolution(
  symbol: string,
  assetClass: MarketAssetClass,
  resolutionId: string,
  barLimit?: number,
): Promise<{ bars: MarketBar[]; hasMore: boolean; windowLabel: string }> {
  const config = getMarketChartResolution(resolutionId)
  const limit = Math.min(500, Math.max(10, Math.floor(barLimit || config.initialBars)))
  const now = Math.floor(Date.now() / 1000)
  const minFromSec = now - config.maxLookbackDays * 86400

  if (assetClass === 'stock' && STOCK_RTH_RESOLUTIONS.has(config.id)) {
    const { bars, hasMore } = await resolveStockRthSeriesByResolution(symbol, config, limit, minFromSec)
    return { bars, hasMore, windowLabel: config.label }
  }

  const fromSec = Math.max(minFromSec, now - fetchSpanSec(config, limit))
  const raw = await fetchRawBarsForWindow(symbol, assetClass, config, fromSec, now)
  const bars = takeLastBars(raw, limit)
  const hasMore = bars.length >= 2 && barUnixSec(bars[0].t) > minFromSec
  return { bars, hasMore, windowLabel: config.label }
}

export async function resolveMarketBarsBeforeByResolution(
  symbol: string,
  assetClass: MarketAssetClass,
  resolutionId: string,
  beforeSec: number,
  barLimit?: number,
): Promise<{ bars: MarketBar[]; hasMore: boolean }> {
  const anchor = Math.floor(beforeSec)
  if (!Number.isFinite(anchor) || anchor <= 0) return { bars: [], hasMore: false }

  const config = getMarketChartResolution(resolutionId)
  const limit = Math.min(500, Math.max(10, Math.floor(barLimit || config.chunkBars)))
  const now = Math.floor(Date.now() / 1000)
  const minFromSec = now - config.maxLookbackDays * 86400
  if (anchor <= minFromSec) return { bars: [], hasMore: false }

  if (assetClass === 'stock' && STOCK_RTH_RESOLUTIONS.has(config.id)) {
    return resolveStockRthBarsBeforeByResolution(symbol, config, anchor, limit, minFromSec)
  }

  const endSec = anchor - 1
  const fromSec = Math.max(minFromSec, endSec - fetchSpanSec(config, limit))
  const raw = await fetchRawBarsForWindow(symbol, assetClass, config, fromSec, endSec)
  const clipped = clipBarsBefore(raw, anchor)
  const bars = takeLastBars(clipped, limit)
  const hasMore = bars.length >= 2 && barUnixSec(bars[0].t) > minFromSec
  return { bars, hasMore }
}
