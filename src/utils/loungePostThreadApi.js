/**
 * Thread helpers for lounge posts (root badge + part count).
 */

import { compareFeedCommentsChronologicalAsc } from './loungeFeedCommentSort.js'

/** @param {object | null | undefined} post */
export function loungePostThreadPartCount(post) {
  const n = Number(post?.thread_part_count)
  return Number.isFinite(n) && n >= 1 ? Math.round(n) : 1
}

export function loungePostIsThreadRoot(post) {
  return loungePostThreadPartCount(post) > 1
}

/** Parts 2+ stored as root-level `feed_comments` with `is_thread_part`. */
export function feedThreadPartsFromComments(comments, viewerPinnedCommentIds = new Set()) {
  return [...(comments || [])]
    .filter((c) => c?.is_thread_part && !c.parent_id)
    .sort(
      (a, b) =>
        (Number(a.thread_part_index) || 0) - (Number(b.thread_part_index) || 0) ||
        compareFeedCommentsChronologicalAsc(a, b, viewerPinnedCommentIds),
    )
}

/** UI label for a thread part row (part 2 → `2`, part 3 → `3`, …). */
export function feedThreadPartDisplayNumber(comment) {
  const idx = Number(comment?.thread_part_index)
  return (Number.isFinite(idx) && idx >= 1 ? idx : 1) + 1
}
