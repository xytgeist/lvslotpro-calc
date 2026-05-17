/** @typedef {'all' | 'following'} LoungeFeedScope */

export const LOUNGE_FEED_SCOPE_ALL = 'all'
export const LOUNGE_FEED_SCOPE_FOLLOWING = 'following'

const COMMUNITY_FEED_SELECT =
  'id,caption,game_title,game_slug,user_id,created_at,edited_at,pinned,like_count,comment_count,repost_count,repost_of_post_id,repost_of_comment_id,is_plain_repost,media_url,gif_url,image_urls,stream_video_uid,stream_poster_url,stream_video_width,stream_video_height'

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} viewerUserId
 * @returns {Promise<string[]>}
 */
export async function fetchLoungeFollowingAuthorIds(supabaseClient, viewerUserId) {
  if (!viewerUserId) return []
  const { data, error } = await supabaseClient
    .from('profile_follows')
    .select('following_id')
    .eq('follower_id', viewerUserId)
  if (error) throw error
  return [...new Set((data || []).map((r) => r.following_id).filter(Boolean))]
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {LoungeFeedScope} scope
 * @param {string[] | null} followingAuthorIds — set when `scope === 'following'`
 */
export function loungeFeedPinnedQuery(supabaseClient, scope, followingAuthorIds) {
  let q = supabaseClient
    .from('community_feed_posts')
    .select(COMMUNITY_FEED_SELECT)
    .eq('pinned', true)
    .order('created_at', { ascending: false })
    .limit(2)
  if (scope === LOUNGE_FEED_SCOPE_FOLLOWING && followingAuthorIds) {
    q = q.in('user_id', followingAuthorIds)
  }
  return q
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {LoungeFeedScope} scope
 * @param {string[] | null} followingAuthorIds
 * @param {number} limit
 */
export function loungeFeedPageQuery(supabaseClient, scope, followingAuthorIds, limit) {
  let q = supabaseClient
    .from('community_feed_posts')
    .select(COMMUNITY_FEED_SELECT)
    .eq('pinned', false)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)
  if (scope === LOUNGE_FEED_SCOPE_FOLLOWING && followingAuthorIds) {
    q = q.in('user_id', followingAuthorIds)
  }
  return q
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {LoungeFeedScope} scope
 * @param {string[] | null} followingAuthorIds
 * @param {{ created_at: string, id: string }} cursor
 * @param {number} limit
 */
export function loungeFeedPageQueryAfterCursor(supabaseClient, scope, followingAuthorIds, cursor, limit) {
  const cursorFilter = `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`
  let q = supabaseClient
    .from('community_feed_posts')
    .select(COMMUNITY_FEED_SELECT)
    .eq('pinned', false)
    .or(cursorFilter)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit)
  if (scope === LOUNGE_FEED_SCOPE_FOLLOWING && followingAuthorIds) {
    q = q.in('user_id', followingAuthorIds)
  }
  return q
}

export { COMMUNITY_FEED_SELECT }
