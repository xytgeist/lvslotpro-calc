/**
 * Feed post helpers: `caption` is the only user-authored text column on `community_feed_posts`.
 */

/** Trimmed caption string (empty if missing). */
export function feedPostDisplayCaption(row) {
  const v = (row || {}).caption
  if (v != null && String(v).trim() !== '') return String(v)
  return ''
}

/** Normalized caption for insert/update (trim, max 280). */
export function normalizeFeedCaption(caption) {
  return String(caption ?? '')
    .trim()
    .slice(0, 280)
}

/**
 * Insert payload for `community_feed_posts` (caption + optional game context).
 */
export function communityFeedPostInsertPayload({
  caption,
  gameTitle = '',
  gameSlug = null,
  /** Staff-only: lounge may set true so the post is created already pinned. */
  pinned,
}) {
  const cap = normalizeFeedCaption(caption)
  const gt = String(gameTitle ?? '').trim()
  const out = {
    caption: cap,
    game_title: gt,
    game_slug: gameSlug || null,
  }
  if (pinned === true) out.pinned = true
  return out
}
