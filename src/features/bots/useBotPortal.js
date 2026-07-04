import { useCallback, useEffect, useState } from 'react'
import { fetchBotPortalSnapshot } from './botPortalApi.js'

const POLL_MS = 45_000

/** @param {import('@supabase/supabase-js').SupabaseClient | null | undefined} supabaseClient */
export function useBotPortal(supabaseClient, opts = {}) {
  const pollMs = opts.pollMs ?? POLL_MS
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!supabaseClient) {
      setError('Supabase client unavailable.')
      setLoading(false)
      return
    }
    setError('')
    const { data, error: rpcError } = await fetchBotPortalSnapshot(supabaseClient)
    if (rpcError) {
      setError(rpcError.message || 'Bot portal snapshot failed.')
      setSnapshot(null)
    } else {
      setSnapshot(data || null)
    }
    setLoading(false)
  }, [supabaseClient])

  useEffect(() => {
    void load()
    if (!pollMs) return undefined
    const id = window.setInterval(() => void load(), pollMs)
    return () => window.clearInterval(id)
  }, [load, pollMs])

  return { snapshot, loading, error, reload: load }
}
