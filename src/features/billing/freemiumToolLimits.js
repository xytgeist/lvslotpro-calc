export const FREE_BANKROLL_SESSION_LIMIT = 10
export const FREE_PLAY_LOG_LIMIT = 10

/** @param {{ isStaff?: boolean, hasSlotsEdge?: boolean }} opts */
export function hasUnlimitedToolAccess({ isStaff = false, hasSlotsEdge = false } = {}) {
  return Boolean(isStaff || hasSlotsEdge)
}

/** @param {{ count?: number, isStaff?: boolean, hasSlotsEdge?: boolean }} opts */
export function canCreateBankrollSession({ count = 0, isStaff = false, hasSlotsEdge = false } = {}) {
  if (hasUnlimitedToolAccess({ isStaff, hasSlotsEdge })) return true
  return count < FREE_BANKROLL_SESSION_LIMIT
}

/** @param {{ count?: number, isStaff?: boolean, hasSlotsEdge?: boolean }} opts */
export function canCreatePlayLog({ count = 0, isStaff = false, hasSlotsEdge = false } = {}) {
  if (hasUnlimitedToolAccess({ isStaff, hasSlotsEdge })) return true
  return count < FREE_PLAY_LOG_LIMIT
}

/** @param {number} limit @param {number} count @param {boolean} unlimited */
export function freemiumUsageRemaining(limit, count, unlimited) {
  if (unlimited) return null
  return Math.max(0, limit - count)
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} userId
 */
export async function fetchFreemiumToolUsageCounts(supabaseClient, userId) {
  const [bankrollRes, playLogRes] = await Promise.all([
    supabaseClient
      .from('bankroll_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
    supabaseClient
      .from('play_log_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId),
  ])

  if (bankrollRes.error) throw bankrollRes.error
  if (playLogRes.error) throw playLogRes.error

  return {
    bankrollSessionCount: bankrollRes.count ?? 0,
    playLogCount: playLogRes.count ?? 0,
  }
}
