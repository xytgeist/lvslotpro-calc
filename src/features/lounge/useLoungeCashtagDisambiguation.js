import { useEffect, useMemo, useState } from 'react'
import { extractCashtagsFromCaption } from '../../utils/loungeMarketCaptionParse.js'
import { loungeMarketResolveCashtags } from '../../utils/loungeMarketApi.js'

/**
 * Debounced Edge `resolve_cashtags` for compose / post-edit captions.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient | null | undefined} supabaseClient
 * @param {string} caption
 */
export function useLoungeCashtagDisambiguation(supabaseClient, caption) {
  const tags = useMemo(() => extractCashtagsFromCaption(caption), [caption])
  const tagsKey = tags.join(',')

  const [byTag, setByTag] = useState(/** @type {Record<string, object>} */ ({}))
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!supabaseClient || !tags.length) {
      setByTag({})
      setLoading(false)
      return undefined
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      setLoading(true)
      void loungeMarketResolveCashtags(supabaseClient, tags)
        .then((data) => {
          if (cancelled) return
          if (data?.error) {
            console.warn('[lounge] resolve_cashtags:', data.error)
          }
          setByTag(data?.by_tag && typeof data.by_tag === 'object' ? data.by_tag : {})
        })
        .catch((err) => {
          if (!cancelled) {
            console.warn('[lounge] resolve_cashtags failed:', err)
            setByTag({})
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 320)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [supabaseClient, tagsKey, tags.length])

  const ambiguousTags = useMemo(
    () =>
      tags.filter((t) => {
        const info = byTag[t]
        if (!info) return false
        if (info.ambiguous === true) return true
        return Array.isArray(info.candidates) && info.candidates.length >= 2
      }),
    [tags, byTag],
  )

  return { byTag, loading, ambiguousTags }
}
