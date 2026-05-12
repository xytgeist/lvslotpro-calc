/**
 * Lounge GIF search via Supabase Edge Function `klipy-gifs` (hides `KLIPY_API_KEY`).
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {{ kind: 'search' | 'trending'; q?: string; page?: number; per_page?: number; locale?: string; rating?: string }} params
 * @returns {Promise<{ items: Array<{ id: string; title: string; gifUrl: string; previewUrl: string }>; hasNext: boolean; errorMessage: string }>}
 */
export async function fetchKlipyGifs(supabaseClient, params) {
  const kind = params?.kind === 'trending' ? 'trending' : 'search'
  const body = {
    kind,
    q: kind === 'search' ? String(params?.q || '').trim() : undefined,
    page: Number(params?.page) > 0 ? Number(params.page) : 1,
    per_page: Number(params?.per_page) > 0 ? Number(params.per_page) : 24,
  }
  if (params?.locale) body.locale = String(params.locale).trim()
  if (params?.rating) body.rating = String(params.rating).trim()

  const { data, error } = await supabaseClient.functions.invoke('klipy-gifs', { body })

  if (error) {
    const msg = String(error.message || 'GIF search failed.')
    return { items: [], hasNext: false, errorMessage: msg }
  }

  if (data && typeof data === 'object' && data.error) {
    return { items: [], hasNext: false, errorMessage: String(data.error) }
  }

  const items = Array.isArray(data?.items) ? data.items : []
  const hasNext = Boolean(data?.hasNext)
  return { items, hasNext, errorMessage: '' }
}
