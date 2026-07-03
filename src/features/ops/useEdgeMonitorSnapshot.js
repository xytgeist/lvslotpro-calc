import { useCallback, useEffect, useState } from 'react'
import { fetchOpsMonitorSnapshot } from './opsMonitorApi.js'

/** @param {import('@supabase/supabase-js').SupabaseClient | null | undefined} supabaseClient */
export function useEdgeMonitorSnapshot(supabaseClient) {
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

  return { snapshot, loading, error, refreshing, load, setSnapshot }
}
