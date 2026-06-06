/** Light/dark colors for TradingView Lightweight Charts in Lounge. */

export function loungeMarketChartIsLight() {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('light')
}

/** @param {boolean} [isLight] */
export function loungeMarketChartTheme(isLight = loungeMarketChartIsLight()) {
  if (isLight) {
    return {
      layout: {
        background: { color: '#fafafa' },
        textColor: '#52525b',
      },
      grid: {
        vertLines: { color: 'rgba(0,0,0,0.04)' },
        horzLines: { color: 'rgba(0,0,0,0.04)' },
      },
      upColor: '#16a34a',
      downColor: '#dc2626',
      cardBg: 'bg-zinc-100/90',
      cardBorder: 'border-zinc-200/80',
      mutedText: 'text-zinc-500',
      priceText: 'text-zinc-900',
    }
  }
  return {
    layout: {
      background: { color: '#18181b' },
      textColor: '#a1a1aa',
    },
    grid: {
      vertLines: { color: 'rgba(255,255,255,0.04)' },
      horzLines: { color: 'rgba(255,255,255,0.04)' },
    },
    upColor: '#22c55e',
    downColor: '#ef4444',
    cardBg: 'bg-zinc-900/80',
    cardBorder: 'border-zinc-700/60',
    mutedText: 'text-zinc-400',
    priceText: 'text-zinc-50',
  }
}

/** @param {Array<{ t: number, c: number }>} bars */
export function loungeMarketBarsToSeries(bars) {
  if (!Array.isArray(bars) || !bars.length) return []
  const mapped = bars
    .filter((b) => Number.isFinite(b?.t) && Number.isFinite(b?.c))
    .map((b) => ({
      time: Math.floor(b.t > 1e12 ? b.t / 1000 : b.t),
      value: b.c,
    }))
    .sort((a, b) => a.time - b.time)

  /** Lightweight Charts requires strictly ascending unique times. */
  const out = []
  for (const point of mapped) {
    const last = out[out.length - 1]
    if (last && last.time === point.time) {
      last.value = point.value
    } else {
      out.push({ time: point.time, value: point.value })
    }
  }
  return out
}
