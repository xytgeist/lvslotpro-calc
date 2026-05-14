/** Matches `AppShell` / feed head select for `community_feed_posts` hydration. */
export const LOUNGE_SINGLE_POST_SELECT =
  'id,caption,game_title,game_slug,user_id,created_at,edited_at,pinned,like_count,comment_count,repost_count,repost_of_post_id,is_plain_repost,media_url,gif_url,image_urls,stream_video_uid,stream_poster_url,stream_video_width,stream_video_height'

/** Standard 8-4-4-4-12 hex UUID string (any version). */
const LOUNGE_POST_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isLoungePostShareId(value) {
  return typeof value === 'string' && LOUNGE_POST_ID_RE.test(value.trim())
}

/**
 * Canonical in-app permalink for a Lounge post (forces Lounge tab).
 * Uses the current origin and path; replaces/overrides `tab` + `post` query keys.
 */
export function buildLoungePostShareUrl(postId) {
  if (typeof window === 'undefined' || !postId) return ''
  const u = new URL(window.location.href)
  u.searchParams.set('tab', 'home')
  u.searchParams.set('post', String(postId))
  return u.toString()
}

export function stripLoungePostQueryParam() {
  if (typeof window === 'undefined') return
  const u = new URL(window.location.href)
  if (!u.searchParams.has('post')) return
  u.searchParams.delete('post')
  const qs = u.searchParams.toString()
  const next = `${u.pathname}${qs ? `?${qs}` : ''}${u.hash}`
  window.history.replaceState(window.history.state ?? {}, '', next)
}

/**
 * Prefer `navigator.share` when allowed; otherwise copy `url` to the clipboard.
 * User cancel / dismiss of the native sheet → `AbortError` → no `onCopied` / `onCopyFailed`.
 */
export async function shareLoungePostHybrid({ url, title, text, onCopied, onCopyFailed }) {
  if (!url) {
    onCopyFailed?.()
    return { mode: 'failed' }
  }
  const shareData = { url, title: title || 'Lounge post', text: text || '' }
  const nav = typeof navigator !== 'undefined' ? navigator : null
  if (nav?.share) {
    const allowed = typeof nav.canShare !== 'function' ? true : nav.canShare(shareData)
    if (allowed) {
      try {
        await nav.share(shareData)
        return { mode: 'native' }
      } catch (e) {
        if (e && typeof e === 'object' && e.name === 'AbortError') {
          return { mode: 'aborted' }
        }
      }
    }
  }
  try {
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(url)
      onCopied?.()
      return { mode: 'copy' }
    }
  } catch {
    // fall through
  }
  onCopyFailed?.()
  return { mode: 'failed' }
}
