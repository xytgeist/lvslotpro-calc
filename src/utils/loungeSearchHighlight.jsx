import { LOUNGE_SEARCH_MIN_CHARS } from '../features/lounge/loungeSearchApi.js'

export const LOUNGE_SEARCH_HIGHLIGHT_CLASS = 'rounded-sm bg-amber-400/25 font-semibold text-amber-100'

/**
 * Terms to mark in result text (full query, stripped `#`/`@`, and word tokens).
 * @param {string} query
 * @returns {string[]}
 */
export function loungeSearchHighlightTerms(query) {
  const raw = String(query || '').trim().toLowerCase()
  if (raw.length < LOUNGE_SEARCH_MIN_CHARS) return []
  const terms = new Set()
  terms.add(raw)
  const stripped = raw.replace(/^[#@]/, '')
  if (stripped.length >= LOUNGE_SEARCH_MIN_CHARS) terms.add(stripped)
  for (const w of raw.split(/\s+/)) {
    const token = w.replace(/^[#@]/, '')
    if (token.length >= LOUNGE_SEARCH_MIN_CHARS) terms.add(token)
  }
  return [...terms].sort((a, b) => b.length - a.length)
}

/**
 * Push plain-text fragments into `out`, wrapping case-insensitive term hits.
 * @param {import('react').ReactNode[]} out
 * @param {{ current: number }} rkRef
 * @param {string} fragment
 * @param {string[]} terms
 * @param {{ keyPrefix?: string, highlightClassName?: string }} [opts]
 */
export function appendHighlightedPlainText(out, rkRef, fragment, terms, opts = {}) {
  if (!fragment) return
  const highlightClassName = opts.highlightClassName || LOUNGE_SEARCH_HIGHLIGHT_CLASS
  const keyPrefix = opts.keyPrefix || 'hl'
  if (!terms?.length) {
    out.push(fragment)
    return
  }
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const re = new RegExp(`(${escaped.join('|')})`, 'gi')
  let last = 0
  let m
  while ((m = re.exec(fragment)) !== null) {
    if (m.index > last) out.push(fragment.slice(last, m.index))
    const match = m[0]
    out.push(
      <mark key={`${keyPrefix}-${rkRef.current++}`} className={highlightClassName}>
        {match}
      </mark>,
    )
    last = m.index + match.length
  }
  if (last < fragment.length) out.push(fragment.slice(last))
}

/**
 * @param {string} text
 * @param {string} query
 * @returns {import('react').ReactNode[] | string | null}
 */
export function renderPlainTextWithSearchHighlight(text, query) {
  const s = String(text ?? '')
  if (!s) return null
  const terms = loungeSearchHighlightTerms(query)
  if (!terms.length) return s
  const out = []
  const rkRef = { current: 0 }
  appendHighlightedPlainText(out, rkRef, s, terms, { keyPrefix: 'pt' })
  return out.length ? out : s
}
