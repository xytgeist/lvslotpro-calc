import { useCallback, useEffect, useState } from 'react'
import { fetchOpsMonitorSubscriberRoster } from './opsMonitorApi.js'

/**
 * @param {import('@supabase/supabase-js').SupabaseClient | null | undefined} supabaseClient
 * @param {{ enabled?: boolean, autoRefreshMs?: number }} [opts]
 */
export function useEdgeMonitorSubscriberRoster(supabaseClient, opts = {}) {
  const { enabled = true, autoRefreshMs = 0 } = opts
  const [roster, setRoster] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(
    async (isRefresh = false) => {
      if (!enabled || !supabaseClient) {
        setLoading(false)
        return
      }
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError('')
      const { data, error: rpcError } = await fetchOpsMonitorSubscriberRoster(supabaseClient)
      if (rpcError) {
        setError(rpcError.message || 'Failed to load subscriber roster.')
        setRoster(null)
      } else {
        setRoster(data || null)
      }
      setLoading(false)
      setRefreshing(false)
    },
    [enabled, supabaseClient],
  )

  useEffect(() => {
    void load(false)
  }, [load])

  useEffect(() => {
    if (!autoRefreshMs || autoRefreshMs < 5_000 || !enabled || !supabaseClient) return undefined
    const id = window.setInterval(() => void load(true), autoRefreshMs)
    return () => window.clearInterval(id)
  }, [autoRefreshMs, enabled, load, supabaseClient])

  return { roster, loading, error, refreshing, load }
}
