import { useCallback, useEffect, useState } from 'react'
import { fetchOpsMonitorLivePulse } from './opsMonitorApi.js'

const LIVE_POLL_MS = 15_000

/** @param {import('@supabase/supabase-js').SupabaseClient | null | undefined} supabaseClient @param {{ enabled?: boolean }} [opts] */
export function useEdgeMonitorLivePulse(supabaseClient, opts = {}) {
  const { enabled = true } = opts
  const [live, setLive] = useState(null)
  const [error, setError] = useState('')

  const poll = useCallback(async () => {
    if (!supabaseClient || !enabled) return
    const { data, error: rpcError } = await fetchOpsMonitorLivePulse(supabaseClient)
    if (rpcError) {
      setError(rpcError.message || 'Live pulse unavailable.')
      return
    }
    setError('')
    setLive(data || null)
  }, [supabaseClient, enabled])

  useEffect(() => {
    if (!enabled || !supabaseClient) {
      setLive(null)
      return undefined
    }
    void poll()
    const id = window.setInterval(() => void poll(), LIVE_POLL_MS)
    return () => window.clearInterval(id)
  }, [enabled, poll, supabaseClient])

  return { live, error, poll }
}
