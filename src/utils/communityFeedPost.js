/**
 * Feed post helpers: `caption` is the only user-authored text column on `community_feed_posts`.
 */

/** Trimmed caption string (empty if missing). */
export function feedPostDisplayCaption(row) {
  const v = (row || {}).caption
  if (v != null && String(v).trim() !== '') return String(v)
  return ''
}

/**
 * Insert payload for `community_feed_posts` (caption + optional game context).
 */
export function communityFeedPostInsertPayload({
  caption,
  gameTitle = '',
  gameSlug = null,
}) {
  const cap = String(caption ?? '')
    .trim()
    .slice(0, 280)
  const gt = String(gameTitle ?? '').trim()
  return {
    caption: cap,
    game_title: gt,
    game_slug: gameSlug || null,
  }
}
