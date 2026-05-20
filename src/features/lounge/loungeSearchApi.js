/** Minimum query length enforced by `lounge_search_*` RPCs (server + client). */
export const LOUNGE_SEARCH_MIN_CHARS = 2

const SEARCH_DEBOUNCE_MS = 300

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} query
 * @param {{ limit?: number, offset?: number }} [opts]
 */
export async function loungeSearchPosts(supabaseClient, query, { limit = 40, offset = 0 } = {}) {
  const { data, error } = await supabaseClient.rpc('lounge_search_posts', {
    p_query: query,
    p_limit: limit,
    p_offset: offset,
  })
  if (error) throw error
  return data || []
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} query
 * @param {{ limit?: number }} [opts]
 */
export async function loungeSearchProfiles(supabaseClient, query, { limit = 20 } = {}) {
  const { data, error } = await supabaseClient.rpc('lounge_search_profiles', {
    p_query: query,
    p_limit: limit,
  })
  if (error) throw error
  return data || []
}

export { SEARCH_DEBOUNCE_MS }
