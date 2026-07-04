/**
 * Financial wire bot caption builder (original wording, <= 500 chars).
 */

import { extractTickers, type NewsCandidate } from './loungeBotNewsScore.ts'

const CAPTION_MAX = 500

function cleanHeadline(raw: string): string {
  let s = String(raw || '')
    .replace(/\s+/g, ' ')
    .trim()
  s = s.replace(/^breaking[:\s-]+/i, '')
  s = s.replace(/\.\.\.$/, '.')
  if (s && !/[.!?]$/.test(s)) s += '.'
  return s
}

function shorten(text: string, max: number): string {
  const t = String(text || '').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trim()}…`
}

/** Build Lounge caption from a news candidate. */
export function buildFinancialWireCaption(item: NewsCandidate): string {
  const title = cleanHeadline(item.title)
  const tickers = item.tickers?.length
    ? item.tickers.map((t) => t.toUpperCase())
    : extractTickers(`${item.title} ${item.summary || ''}`)

  const lead =
    tickers.length > 0
      ? tickers.slice(0, 3).map((t) => `$${t}`).join(' ')
      : ''

  let body = title
  if (lead) {
    const withoutDup = body.replace(new RegExp(`\\$?(${tickers.join('|')})`, 'gi'), '').trim()
    body = withoutDup.length > 20 ? withoutDup : title
    body = `${lead} ${body}`.trim()
  }

  return shorten(body, CAPTION_MAX)
}
