/** @typedef {Record<string, { active?: boolean }>} CreatorFanEntitlementsMap */

export const LOUNGE_COMPOSER_AUDIENCE_ALL = 'all'
export const LOUNGE_COMPOSER_AUDIENCE_SUBS = 'subs'

export function normalizeLoungeComposerAudience(raw) {
  return raw === LOUNGE_COMPOSER_AUDIENCE_SUBS ? LOUNGE_COMPOSER_AUDIENCE_SUBS : LOUNGE_COMPOSER_AUDIENCE_ALL
}

export function readLoungeComposerAudience() {
  if (typeof window === 'undefined') return LOUNGE_COMPOSER_AUDIENCE_ALL
  try {
    const v = window.sessionStorage.getItem('loungeComposerAudience:v1')
    return normalizeLoungeComposerAudience(v)
  } catch {
    return LOUNGE_COMPOSER_AUDIENCE_ALL
  }
}

export function writeLoungeComposerAudience(audience) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(
      'loungeComposerAudience:v1',
      normalizeLoungeComposerAudience(audience),
    )
  } catch {
    // ignore
  }
}

/**
 * @param {CreatorFanEntitlementsMap | null | undefined} entitlements
 * @param {string | null | undefined} creatorUserId
 */
export function viewerHasCreatorFanSub(entitlements, creatorUserId) {
  const id = String(creatorUserId || '').trim()
  if (!id) return false
  const key = `creator-fan:${id}`
  return Boolean(entitlements?.[key]?.active)
}

/**
 * True when UI should show locked teaser + subscribe CTA (server may already have trimmed caption).
 *
 * @param {object | null | undefined} post
 * @param {{ viewerUserId?: string | null, viewerIsStaff?: boolean, fanEntitlements?: CreatorFanEntitlementsMap | null }} ctx
 */
export function isLoungeFanOnlyPostLocked(post, ctx = {}) {
  if (!post?.creator_fan_only) return false
  if (ctx.viewerIsStaff) return false
  const authorId = String(post.user_id || '').trim()
  const viewerId = String(ctx.viewerUserId || '').trim()
  if (viewerId && authorId && viewerId === authorId) return false
  return !viewerHasCreatorFanSub(ctx.fanEntitlements, authorId)
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string[]} postIds
 */
export async function fetchLoungeCommunityFeedPostsForViewer(supabaseClient, postIds) {
  const ids = [...new Set(postIds.map((id) => String(id || '').trim()).filter(Boolean))]
  if (!ids.length) return []
  const { data, error } = await supabaseClient.rpc('lounge_community_feed_posts_for_viewer', {
    p_post_ids: ids,
  })
  if (error) throw error
  return data || []
}
