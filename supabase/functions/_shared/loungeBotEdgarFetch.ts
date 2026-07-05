/**
 * SEC EDGAR current-filings Atom feed (official public data).
 * https://www.sec.gov/os/webmaster-faq#code-support — requires descriptive User-Agent.
 */

import { parseFeedXml, type NormalizedNewsItem } from './loungeBotRssFetch.ts'

export function secEdgarUserAgent(): string {
  return String(Deno.env.get('SEC_EDGAR_USER_AGENT') || '').trim()
    || 'EdgeTilt MarketEdge/1.0 (support@edgetilt.com)'
}

function edgarAtomUrl(filingType: string, count = 40): string {
  const params = new URLSearchParams({
    action: 'getcurrent',
    output: 'atom',
    owner: 'include',
    count: String(count),
  })
  const type = String(filingType || '').trim()
  if (type) params.set('type', type)
  return `https://www.sec.gov/cgi-bin/browse-edgar?${params}`
}

/** e.g. "8-K - APPLE INC (0000320193) (Filer)" → cleaner headline + ticker guess from company map not available */
function formatEdgarTitle(rawTitle: string, filingType: string): string {
  let title = String(rawTitle || '').trim()
  const type = String(filingType || '').trim().toUpperCase()
  if (type && !title.toUpperCase().startsWith(type)) {
    title = `${type} filing: ${title}`
  }
  // Strip trailing "(Filer)" / CIK clutter for caption readability.
  title = title.replace(/\s*\(\d{10}\)\s*\(Filer\)\s*$/i, '').trim()
  title = title.replace(/\s*\(Filer\)\s*$/i, '').trim()
  return title
}

export async function fetchEdgarCurrentFilings(opts: {
  filingType?: string
  count?: number
  sourceLabel?: string
} = {}): Promise<NormalizedNewsItem[]> {
  const filingType = String(opts.filingType || '').trim()
  const count = Number(opts.count) || 40
  const label = opts.sourceLabel || (filingType ? `SEC EDGAR ${filingType}` : 'SEC EDGAR')

  const url = edgarAtomUrl(filingType, count)
  const res = await fetch(url, {
    headers: {
      Accept: 'application/atom+xml, application/xml',
      'User-Agent': secEdgarUserAgent(),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`SEC EDGAR ${filingType || 'all'} ${res.status}: ${text.slice(0, 120)}`)
  }

  const xml = await res.text()
  const rows = parseFeedXml(xml, label)
  return rows.map((row) => {
    const title = formatEdgarTitle(row.title, filingType)
    return {
      ...row,
      title,
      summary: row.summary || `${filingType || 'Filing'} posted on SEC EDGAR.`,
      sourceName: label,
      raw: { ...row.raw, filingType, edgar: true },
    }
  })
}
