import { useEffect } from 'react'
import { LOUNGE_MARKET_EMBED_MAX } from '../../utils/loungeMarketCaptionParse.js'
import {
  getComposerMarketSymbolForCashtag,
  marketSymbolDedupeKey,
  mergeComposerMarketSymbolForCashtag,
} from './loungeMarketSymbolUtils.js'

function candidateKey(row) {
  return marketSymbolDedupeKey(row)
}

function candidateLabel(row) {
  const name = row?.name || row?.description || row?.symbol || ''
  const ticker = row?.display_symbol || row?.symbol || ''
  const kind = row?.asset_class === 'crypto' ? 'crypto' : 'stock'
  return `${name} (${ticker} · ${kind})`
}

/**
 * Compact inline picker when a caption cashtag maps to more than one instrument.
 *
 * @param {{
 *   ambiguousTags: string[],
 *   byTag: Record<string, { suggested?: object, candidates?: object[] }>,
 *   loading?: boolean,
 *   symbols: object[],
 *   onChangeSymbols: (next: object[]) => void,
 *   className?: string,
 * }} props
 */
export default function LoungeComposerCashtagDisambiguation({
  ambiguousTags,
  byTag,
  loading = false,
  symbols,
  onChangeSymbols,
  className = '',
}) {
  const tags = ambiguousTags

  useEffect(() => {
    if (!tags.length) return
    onChangeSymbols((prev) => {
      const base = Array.isArray(prev) ? prev : []
      let next = base
      let changed = false
      for (const tag of tags) {
        if (getComposerMarketSymbolForCashtag(next, tag)) continue
        const info = byTag[tag]
        const candidates = Array.isArray(info?.candidates) ? info.candidates : []
        const picked = candidates[0] || info?.suggested
        if (!picked) continue
        next = mergeComposerMarketSymbolForCashtag(next, tag, picked, LOUNGE_MARKET_EMBED_MAX)
        changed = true
      }
      return changed ? next : base
    })
  }, [byTag, onChangeSymbols, tags])

  if (!tags.length) return null

  return (
    <div className={`space-y-1.5 ${className}`} data-lounge-cashtag-disambiguation="">
      {loading ? <p className="text-[11px] text-zinc-500">Checking tickers…</p> : null}
      {tags.map((tag) => {
        const info = byTag[tag] || {}
        const candidates = Array.isArray(info.candidates) ? info.candidates : []
        if (candidates.length < 2) return null
        const picked = getComposerMarketSymbolForCashtag(symbols, tag)
        const selectedKey =
          (picked ? candidateKey(picked) : '') ||
          candidateKey(candidates[0]) ||
          ''
        return (
          <label key={tag} className="flex items-center gap-2">
            <span className="shrink-0 text-[12px] font-semibold text-cyan-300">${tag}</span>
            <select
              value={selectedKey}
              onChange={(e) => {
                const row = candidates.find((c) => candidateKey(c) === e.target.value)
                if (!row) return
                onChangeSymbols((prev) =>
                  mergeComposerMarketSymbolForCashtag(prev, tag, row, LOUNGE_MARKET_EMBED_MAX),
                )
              }}
              className="min-w-0 flex-1 rounded-lg border border-zinc-600/70 bg-zinc-900/80 px-2 py-1 text-[12px] text-zinc-100"
            >
              {candidates.map((c) => {
                const key = candidateKey(c)
                return (
                  <option key={key} value={key}>
                    {candidateLabel(c)}
                  </option>
                )
              })}
            </select>
          </label>
        )
      })}
    </div>
  )
}
