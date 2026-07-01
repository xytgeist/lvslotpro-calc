/** Client-side OHLC helpers for market chart bars. */

/** @param {{ t: number, c: number, o?: number, h?: number, l?: number, v?: number } | null | undefined} bar */
export function marketBarHasOhlc(bar) {
  if (!bar) return false
  return (
    Number.isFinite(bar.o) &&
    Number.isFinite(bar.h) &&
    Number.isFinite(bar.l) &&
    Number.isFinite(bar.c)
  )
}

/** @param {{ t: number, c: number, o?: number, h?: number, l?: number, v?: number }} bar */
export function marketBarRowFields(bar) {
  const t = Math.floor(bar.t > 1e12 ? bar.t / 1000 : bar.t)
  const row = { t, c: bar.c }
  if (Number.isFinite(bar.o)) row.o = bar.o
  if (Number.isFinite(bar.h)) row.h = bar.h
  if (Number.isFinite(bar.l)) row.l = bar.l
  if (Number.isFinite(bar.v)) row.v = bar.v
  return row
}
