/** OHLC fields on market bar points (`t` + `c` required; `o`/`h`/`l` optional). */

export type MarketBarOhlc = {
  t: number
  c: number
  o?: number
  h?: number
  l?: number
  v?: number
}

export function marketBarHasOhlc(bar: MarketBarOhlc | null | undefined): boolean {
  if (!bar) return false
  return (
    Number.isFinite(bar.o) &&
    Number.isFinite(bar.h) &&
    Number.isFinite(bar.l) &&
    Number.isFinite(bar.c)
  )
}

/** Copy bar with normalized unix `t` and optional OHLCV fields. */
export function normalizeMarketBarPoint(bar: MarketBarOhlc): MarketBarOhlc {
  const t = Math.floor(bar.t > 1e12 ? bar.t / 1000 : bar.t)
  const out: MarketBarOhlc = { t, c: bar.c }
  if (Number.isFinite(bar.o)) out.o = bar.o
  if (Number.isFinite(bar.h)) out.h = bar.h
  if (Number.isFinite(bar.l)) out.l = bar.l
  if (Number.isFinite(bar.v)) out.v = bar.v
  return out
}

/** Merge duplicate timestamp — keep first open, widen high/low, latest close/volume. */
export function mergeMarketBarSameTime(last: MarketBarOhlc, bar: MarketBarOhlc): void {
  last.c = bar.c
  if (bar.v != null) last.v = bar.v
  if (!marketBarHasOhlc(bar)) return
  if (!marketBarHasOhlc(last)) {
    last.o = bar.o
    last.h = bar.h
    last.l = bar.l
    return
  }
  last.h = Math.max(last.h!, bar.h!)
  last.l = Math.min(last.l!, bar.l!)
}

/** Bucket bars to `bucketSec` with proper OHLCV aggregation. */
export function aggregateMarketBarsToBucketSec(bars: MarketBarOhlc[], bucketSec: number): MarketBarOhlc[] {
  if (!bars.length || bucketSec <= 0) return []
  const buckets = new Map<
    number,
    { o: number; h: number; l: number; c: number; v: number; hasOhlc: boolean }
  >()

  for (const bar of bars) {
    if (!Number.isFinite(bar?.t) || !Number.isFinite(bar?.c)) continue
    const key = Math.floor(bar.t / bucketSec) * bucketSec
    const o = marketBarHasOhlc(bar) ? bar.o! : bar.c
    const h = marketBarHasOhlc(bar) ? bar.h! : bar.c
    const l = marketBarHasOhlc(bar) ? bar.l! : bar.c
    const vAdd = Number.isFinite(bar.v) ? Number(bar.v) : 0
    const prev = buckets.get(key)
    if (!prev) {
      buckets.set(key, {
        o,
        h,
        l,
        c: bar.c,
        v: vAdd,
        hasOhlc: marketBarHasOhlc(bar),
      })
      continue
    }
    prev.h = Math.max(prev.h, h)
    prev.l = Math.min(prev.l, l)
    prev.c = bar.c
    prev.v += vAdd
    prev.hasOhlc = prev.hasOhlc || marketBarHasOhlc(bar)
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([t, row]) => ({
      t,
      c: row.c,
      o: row.o,
      h: row.h,
      l: row.l,
      ...(row.v > 0 ? { v: row.v } : {}),
    }))
}
