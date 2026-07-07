/**
 * Parse x.com / twitter.com post URLs (or raw tweet id).
 */
export function parseXTweetUrl(raw: string): { tweetId: string; handle: string } | null {
  const s = String(raw || '').trim()
  if (!s) return null

  if (/^\d{10,25}$/.test(s)) {
    return { tweetId: s, handle: '' }
  }

  try {
    const u = new URL(s.includes('://') ? s : `https://${s}`)
    const host = u.hostname.replace(/^www\./, '').toLowerCase()
    if (!['x.com', 'twitter.com', 'mobile.twitter.com'].includes(host)) return null
    const m = u.pathname.match(/^\/([^/]+)\/status\/(\d+)/i)
    if (!m?.[2]) return null
    return { tweetId: m[2], handle: String(m[1] || '').replace(/^@/, '').toLowerCase() }
  } catch {
    return null
  }
}

export function canonicalXTweetUrl(handle: string, tweetId: string, fallbackUrl?: string) {
  const h = String(handle || '').replace(/^@/, '').trim()
  const id = String(tweetId || '').trim()
  if (h && id) return `https://x.com/${h}/status/${id}`
  return String(fallbackUrl || '').trim() || (id ? `https://x.com/i/status/${id}` : '')
}
