/**
 * Session-only map: Cloudflare Stream uid → composer-captured JPEG `blob:` URL.
 * Used so the feed tile can show stable intrinsic dimensions immediately after post,
 * then `LoungePostStreamVideo` swaps to CF `thumbnail.jpg` when it loads and revokes here.
 */

const byUid = new Map()

/**
 * @param {string} uid Stream asset id (hex)
 * @param {string} objectUrl `blob:` URL from `URL.createObjectURL` (JPEG poster)
 */
export function pinLoungeStreamSessionPoster(uid, objectUrl) {
  const id = String(uid || '').trim()
  const u = String(objectUrl || '').trim()
  if (!id || !u.startsWith('blob:')) return
  const prev = byUid.get(id)
  if (prev && prev !== u) {
    try {
      URL.revokeObjectURL(prev)
    } catch {
      // ignore
    }
  }
  byUid.set(id, u)
}

/** @param {string} uid */
export function peekLoungeStreamSessionPoster(uid) {
  const id = String(uid || '').trim()
  if (!id) return ''
  return byUid.get(id) || ''
}

/** Revoke and drop (call after CF poster is showing). */
export function releaseLoungeStreamSessionPoster(uid) {
  const id = String(uid || '').trim()
  const u = byUid.get(id)
  if (!u) return
  try {
    URL.revokeObjectURL(u)
  } catch {
    // ignore
  }
  byUid.delete(id)
}
