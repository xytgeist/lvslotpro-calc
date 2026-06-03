/**
 * @typedef {'sending' | 'delivered' | 'read'} ChatReceiptStatus
 */

/**
 * @typedef {{
 *   status: ChatReceiptStatus,
 *   readAt?: string | null,
 * }} ChatMessageReceipt
 */

/**
 * @typedef {{
 *   user_id: string,
 *   receipts_enabled?: boolean,
 *   last_read_at?: string | null,
 *   last_read_message_id?: string | null,
 * }} ChatPeerReadState
 */

/**
 * True when `peer` has read through `message` (by message id or timestamp).
 * @param {{ id: string, created_at?: string | null }} message
 * @param {ChatPeerReadState} peer
 */
export function peerHasReadMessage(message, peer) {
  if (!message?.id || String(message.id).startsWith('opt-')) return false
  if (peer?.last_read_message_id && peer.last_read_message_id === message.id) return true
  if (peer?.last_read_at && message.created_at) {
    return new Date(peer.last_read_at).getTime() >= new Date(message.created_at).getTime()
  }
  return false
}

/**
 * Latest peer read timestamp for a message (group: max among readers; DM: peer time).
 * @param {{ id: string, created_at?: string | null }} message
 * @param {ChatPeerReadState[]} peers
 */
export function readAtForMessage(message, peers) {
  let maxMs = 0
  for (const peer of peers) {
    if (!peerHasReadMessage(message, peer) || !peer.last_read_at) continue
    const ms = new Date(peer.last_read_at).getTime()
    if (Number.isFinite(ms) && ms > maxMs) maxMs = ms
  }
  return maxMs > 0 ? new Date(maxMs).toISOString() : null
}

/** @param {string} iso */
export function formatReadReceiptTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/**
 * Receipt label for the viewer's own message (DM / group only; not channels).
 * @param {{
 *   message: { id: string, sender_id: string, created_at?: string | null },
 *   viewerUserId: string,
 *   roomKind: string,
 *   viewerReceiptsEnabled: boolean,
 *   peerReadStates: ChatPeerReadState[],
 *   showOnThisMessage?: boolean,
 * }} opts
 * @returns {ChatMessageReceipt | null}
 */
export function getMessageReceiptStatus({
  message,
  viewerUserId,
  roomKind,
  viewerReceiptsEnabled,
  peerReadStates,
  showOnThisMessage = true,
}) {
  if (!showOnThisMessage) return null
  if (!message || message.sender_id !== viewerUserId) return null
  if (roomKind === 'channel') return null
  if (String(message.id).startsWith('opt-')) return { status: 'sending' }

  if (!viewerReceiptsEnabled) return { status: 'delivered' }

  const peers = (peerReadStates || []).filter((p) => p.user_id !== viewerUserId)
  if (peers.length === 0) return { status: 'delivered' }

  const visiblePeers = peers.filter((p) => p.receipts_enabled !== false)
  if (visiblePeers.length === 0) return { status: 'delivered' }

  const allRead = visiblePeers.every((p) => peerHasReadMessage(message, p))
  if (!allRead) return { status: 'delivered' }

  return {
    status: 'read',
    readAt: readAtForMessage(message, visiblePeers),
  }
}

/**
 * Id of the viewer's most recent non-deleted message (for single status line).
 * @param {any[]} messages
 * @param {string} viewerUserId
 */
export function findLastOwnMessageId(messages, viewerUserId) {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i]
    if (m?.sender_id === viewerUserId && !m.deleted_at && m.id) return m.id
  }
  return null
}
