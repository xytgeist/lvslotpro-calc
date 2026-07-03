import { useCallback, useEffect, useState } from 'react'
import { fetchOpsMonitorSnapshot } from './opsMonitorApi.js'

/**
 * @param {import('@supabase/supabase-js').SupabaseClient | null | undefined} supabaseClient
 * @param {{ autoRefreshMs?: number }} [opts]
 */
export function useEdgeMonitorSnapshot(supabaseClient, opts = {}) {
  const { autoRefreshMs = 0 } = opts
  const [snapshot, setSnapshot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(
    async (isRefresh = false) => {
      if (!supabaseClient) {
        setError('Supabase client unavailable.')
        setLoading(false)
        return
      }
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError('')
      const { data, error: rpcError } = await fetchOpsMonitorSnapshot(supabaseClient)
      if (rpcError) {
        setError(rpcError.message || 'Failed to load monitor snapshot.')
        setSnapshot(null)
      } else {
        setSnapshot(data || null)
      }
      setLoading(false)
      setRefreshing(false)
    },
    [supabaseClient],
  )

  useEffect(() => {
    void load(false)
  }, [load])

  useEffect(() => {
    if (!autoRefreshMs || autoRefreshMs < 5_000 || !supabaseClient) return undefined
    const id = window.setInterval(() => void load(true), autoRefreshMs)
    return () => window.clearInterval(id)
  }, [autoRefreshMs, load, supabaseClient])

  return { snapshot, loading, error, refreshing, load, setSnapshot }
}
