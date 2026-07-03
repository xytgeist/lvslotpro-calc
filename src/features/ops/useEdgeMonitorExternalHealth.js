import { useCallback, useEffect, useState } from 'react'
import { fetchOpsMonitorExternalHealth } from './opsMonitorApi.js'

const EXTERNAL_POLL_MS = 120_000

/** @param {import('@supabase/supabase-js').SupabaseClient | null | undefined} supabaseClient */
export function useEdgeMonitorExternalHealth(supabaseClient) {
  const [external, setExternal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!supabaseClient) {
      setError('Supabase client unavailable.')
      setLoading(false)
      return
    }
    setError('')
    const { data, error: probeError } = await fetchOpsMonitorExternalHealth(supabaseClient)
    if (probeError) {
      setError(probeError.message || 'External health probe failed.')
      setExternal(null)
    } else {
      setExternal(data || null)
    }
    setLoading(false)
  }, [supabaseClient])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), EXTERNAL_POLL_MS)
    return () => window.clearInterval(id)
  }, [load])

  return { external, loading, error, reload: load }
}
