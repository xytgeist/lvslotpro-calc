import { useCallback, useEffect, useState } from 'react'
import { fetchLoungeBotOpsSnapshot } from './opsMonitorApi.js'

const BOT_OPS_POLL_MS = 60_000

/** @param {import('@supabase/supabase-js').SupabaseClient | null | undefined} supabaseClient */
export function useLoungeBotOps(supabaseClient) {
  const [botOps, setBotOps] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!supabaseClient) {
      setError('Supabase client unavailable.')
      setLoading(false)
      return
    }
    setError('')
    const { data, error: rpcError } = await fetchLoungeBotOpsSnapshot(supabaseClient)
    if (rpcError) {
      setError(rpcError.message || 'Bot ops snapshot failed.')
      setBotOps(null)
    } else {
      setBotOps(data || null)
    }
    setLoading(false)
  }, [supabaseClient])

  useEffect(() => {
    void load()
    const id = window.setInterval(() => void load(), BOT_OPS_POLL_MS)
    return () => window.clearInterval(id)
  }, [load])

  return { botOps, loading, error, reload: load }
}
