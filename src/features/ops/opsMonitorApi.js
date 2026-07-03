/**
 * Admin-only Edge Monitor snapshot from Supabase RPC + Phase 3/5 helpers.
 */

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @returns {Promise<{ data: object | null, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchOpsMonitorSnapshot(supabaseClient) {
  const { data, error } = await supabaseClient.rpc('admin_ops_monitor_snapshot')
  return { data, error }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @returns {Promise<{ data: object | null, error: Error | null }>}
 */
export async function fetchOpsMonitorExternalHealth(supabaseClient) {
  if (!supabaseClient) {
    return { data: null, error: new Error('Supabase client unavailable.') }
  }

  const { data, error } = await supabaseClient.functions.invoke('admin-ops-external-health', {
    method: 'GET',
  })

  if (error) {
    return { data: null, error: new Error(error.message || 'External health probe failed.') }
  }

  if (data?.error) {
    return { data: null, error: new Error(String(data.error)) }
  }

  return { data: data || null, error: null }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @returns {Promise<{ data: object | null, error: import('@supabase/supabase-js').PostgrestError | null }>}
 */
export async function fetchOpsMonitorLivePulse(supabaseClient) {
  const { data, error } = await supabaseClient.rpc('admin_ops_monitor_live_pulse')
  return { data, error }
}

/** @param {unknown} value */
export function formatOpsMonitorCount(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 })
}

/**
 * @param {Array<{ product_slug?: string, status?: string, kind?: string, count?: number }> | null | undefined} rows
 * @param {string} key
 */
export function formatOpsMonitorBreakdown(rows, key = 'count') {
  if (!Array.isArray(rows) || rows.length === 0) return '—'
  return rows
    .map((row) => {
      const label =
        row.product_slug || row.status || row.kind || '?'
      const count = formatOpsMonitorCount(row[key] ?? row.count)
      return `${label}: ${count}`
    })
    .join(' · ')
}

/** First segment of Supabase host for env badge (e.g. jtjgtucumuoswnbauxry). */
export function opsMonitorSupabaseProjectRef() {
  try {
    const host = new URL(import.meta.env.VITE_SUPABASE_URL || '').hostname
    return host.split('.')[0] || 'unknown'
  } catch {
    return 'unknown'
  }
}

/**
 * @param {Array<{ query?: string, count?: number }> | null | undefined} rows
 * @param {number} [limit]
 */
export function formatOpsMonitorTopQueries(rows, limit = 8) {
  if (!Array.isArray(rows) || rows.length === 0) return '—'
  return rows
    .slice(0, limit)
    .map((row, i) => `${i + 1}. ${row.query || '?'} (${formatOpsMonitorCount(row.count)})`)
    .join('\n')
}
