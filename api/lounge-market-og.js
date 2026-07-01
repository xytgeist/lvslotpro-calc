/**
 * Vercel Serverless: SVG Open Graph image for Lounge market chart embeds.
 * GET `/api/lounge-market-og?postId=…&symbol=…`
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function escapeXml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function barsToSparklinePath(bars, width, height) {
  if (!Array.isArray(bars) || !bars.length) return ''
  const closes = bars.map((b) => Number(b?.c)).filter((n) => Number.isFinite(n))
  if (!closes.length) return ''
  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const span = max - min || 1
  const pad = 4
  const w = width - pad * 2
  const h = height - pad * 2
  return closes
    .map((c, i) => {
      const x = pad + (i / Math.max(1, closes.length - 1)) * w
      const y = pad + h - ((c - min) / span) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

function buildMarketOgSvg(embed) {
  const quote = embed?.quote || {}
  const changePct = Number(quote.change_pct)
  const up = Number.isFinite(changePct) ? changePct >= 0 : true
  const color = up ? '#22c55e' : '#ef4444'
  const bars = Array.isArray(embed?.bars) ? embed.bars : []
  const path = barsToSparklinePath(
    bars.length ? bars : [{ c: quote.price }, { c: quote.price }],
    600,
    280,
  )
  const price = Number(quote.price)
  const priceStr = Number.isFinite(price) ? price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'
  const pctStr = Number.isFinite(changePct)
    ? `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`
    : '—'
  const title = `${embed.display_symbol || embed.symbol} · ${embed.window_label || '24h'}`
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#09090b"/>
  <text x="64" y="120" fill="#fafafa" font-family="system-ui,sans-serif" font-size="56" font-weight="700">${escapeXml(title)}</text>
  <text x="64" y="190" fill="#a1a1aa" font-family="system-ui,sans-serif" font-size="32">${escapeXml(embed.name || '')}</text>
  <text x="64" y="280" fill="#fafafa" font-family="system-ui,sans-serif" font-size="72" font-weight="700">$${escapeXml(priceStr)}</text>
  <text x="64" y="340" fill="${color}" font-family="system-ui,sans-serif" font-size="40" font-weight="600">${escapeXml(pctStr)}</text>
  <path d="${path}" fill="none" stroke="${color}" stroke-width="4" transform="translate(64,380) scale(1.8,1)"/>
</svg>`
}

async function fetchJson(url, headers) {
  const res = await fetch(url, { headers, redirect: 'follow' })
  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }
  return { ok: res.ok, data }
}

function normalizeEmbeds(raw) {
  if (!raw) return []
  let arr = raw
  if (typeof raw === 'string') {
    try {
      arr = JSON.parse(raw)
    } catch {
      return []
    }
  }
  return Array.isArray(arr) ? arr.filter(Boolean) : []
}

function findEmbed(embeds, symbol) {
  const want = String(symbol || '').trim().toUpperCase()
  if (!want) return embeds[0] || null
  return (
    embeds.find(
      (e) =>
        String(e?.display_symbol || '').trim().toUpperCase() === want ||
        String(e?.symbol || '').trim().toUpperCase() === want,
    ) || embeds[0] ||
    null
  )
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.statusCode = 405
    res.end('Method Not Allowed')
    return
  }

  let postId = typeof req.query?.postId === 'string' ? req.query.postId : ''
  let symbol = typeof req.query?.symbol === 'string' ? req.query.symbol : ''
  if ((!postId || !symbol) && typeof req.url === 'string') {
    try {
      const u = new URL(req.url, 'http://localhost')
      postId = postId || u.searchParams.get('postId') || ''
      symbol = symbol || u.searchParams.get('symbol') || ''
    } catch {
      // ignore
    }
  }
  postId = decodeURIComponent(postId).trim()
  symbol = decodeURIComponent(symbol).trim()

  if (!UUID_RE.test(postId)) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('Invalid postId')
    return
  }

  const supabaseUrl = String(process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
  const anonKey = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim()
  if (!supabaseUrl || !anonKey) {
    res.statusCode = 503
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('OG route misconfigured')
    return
  }

  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
    Accept: 'application/json',
  }

  const postUrl = `${supabaseUrl}/rest/v1/community_feed_posts?id=eq.${postId}&hidden_at=is.null&select=market_embeds`
  const { ok, data: postRows } = await fetchJson(postUrl, headers)
  const post = ok && Array.isArray(postRows) && postRows[0] ? postRows[0] : null
  const embeds = normalizeEmbeds(post?.market_embeds)
  const embed = findEmbed(embeds, symbol)

  if (!embed) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('Chart not found')
    return
  }

  const svg = buildMarketOgSvg(embed)
  res.statusCode = 200
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.end(svg)
}
