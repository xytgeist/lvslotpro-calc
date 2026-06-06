/**
 * Chronological ordering for chat timeline rows (messages + prep-job fakes).
 * Tie-break on id so equal timestamps stay stable.
 */
export function compareChatMessagesChronological(a, b) {
  const ta = new Date(a?.created_at || 0).getTime()
  const tb = new Date(b?.created_at || 0).getTime()
  if (ta !== tb) return ta - tb
  return String(a?.id || '').localeCompare(String(b?.id || ''))
}

/** @template T */
export function sortChatMessagesChronological(messages) {
  return [...messages].sort(compareChatMessagesChronological)
}
