const MARKET_SEARCH_TOKENIZED_RE =
  /ondo|tokenized|xstock|wrapped|dinari|mirrored|\s+on\b|\s+x\b|\.d\b|xstock/i

function marketSearchQueryNorm(query) {
  return String(query || '').trim().toUpperCase().replace(/^\$/, '')
}

function marketSearchRowDisplay(row) {
  return String(row?.display_symbol || row?.symbol || '').trim().toUpperCase()
}

function isTokenizedMarketSearchRow(row) {
  const display = marketSearchRowDisplay(row)
  const desc = String(row?.name || row?.description || '').toLowerCase()
  const hay = `${display} ${desc} ${row?.symbol || ''}`.toLowerCase()
  return (
    MARKET_SEARCH_TOKENIZED_RE.test(hay) ||
    (row?.asset_class === 'crypto' && /stock|equity|etf/i.test(desc))
  )
}

/** Lower score = higher in list. Mirrors Edge `marketSearchRelevanceScore`. */
export function marketSearchRelevanceScore(query, row) {
  const q = marketSearchQueryNorm(query)
  if (!q) return 9999

  const display = marketSearchRowDisplay(row)
  const root = display.includes('.') ? display.split('.')[0] : display
  const assetClass = row?.asset_class === 'crypto' ? 'crypto' : 'stock'

  let score = 500

  if (display === q) {
    score = assetClass === 'stock' ? 0 : 25
  } else if (root === q && assetClass === 'stock') {
    score = 35
  } else if (display.startsWith(`${q} `) || display.startsWith(`${q}.`)) {
    score = assetClass === 'stock' ? 120 : 280
  } else if (root.startsWith(q)) {
    score = assetClass === 'stock' ? 200 : 320
  } else if (display.startsWith(q)) {
    score = assetClass === 'stock' ? 250 : 340
  } else {
    const name = String(row?.name || row?.description || '').toUpperCase()
    if (name.startsWith(q)) score = assetClass === 'stock' ? 420 : 520
    else if (name.includes(q)) score = assetClass === 'stock' ? 560 : 640
    else return 9999
  }

  if (isTokenizedMarketSearchRow(row)) score += 650
  if (assetClass === 'stock' && display.includes('.') && root === q) score += 25

  return score
}

export function sortMarketSearchResults(query, results) {
  return [...results].sort((a, b) => {
    const sa = marketSearchRelevanceScore(query, a)
    const sb = marketSearchRelevanceScore(query, b)
    if (sa !== sb) return sa - sb
    return marketSearchRowDisplay(a).length - marketSearchRowDisplay(b).length
  })
}

export function dedupeMarketSearchRoots(results) {
  const rootCounts = new Map()
  const out = []
  for (const row of results) {
    if (row?.asset_class === 'crypto') {
      out.push(row)
      continue
    }
    const display = marketSearchRowDisplay(row)
    const root = display.includes('.') ? display.split('.')[0] : display
    const count = rootCounts.get(root) || 0
    if (count >= 2) continue
    rootCounts.set(root, count + 1)
    out.push(row)
  }
  return out
}

/**
 * Filter a cached symbol universe locally (no network).
 * @param {object[]} universe
 * @param {string} query
 * @param {number} [maxResults]
 */
export function searchLoungeMarketSymbolUniverse(universe, query, maxResults = 8) {
  const q = String(query || '').trim()
  if (!q || !Array.isArray(universe) || !universe.length) return []

  const qNorm = marketSearchQueryNorm(q)
  const matches = []
  for (const row of universe) {
    if (!row?.symbol) continue
    const score = marketSearchRelevanceScore(qNorm, row)
    if (score >= 9999) continue
    matches.push(row)
  }

  return dedupeMarketSearchRoots(sortMarketSearchResults(qNorm, matches)).slice(0, maxResults)
}
