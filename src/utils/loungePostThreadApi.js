/**
 * Thread helpers for lounge posts (root badge + part count).
 */

/** @param {object | null | undefined} post */
export function loungePostThreadPartCount(post) {
  const n = Number(post?.thread_part_count)
  return Number.isFinite(n) && n >= 1 ? Math.round(n) : 1
}

export function loungePostIsThreadRoot(post) {
  return loungePostThreadPartCount(post) > 1
}
