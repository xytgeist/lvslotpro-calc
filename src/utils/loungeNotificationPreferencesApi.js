/** Lounge per-category push preferences (Phase H3). */

export const LOUNGE_NOTIFICATION_PREF_DEFAULTS = {
  push_replies: true,
  push_mentions: true,
  push_follows: true,
  push_reposts: true,
  push_likes: true,
  push_bookmarks: true,
  push_messages: true,
}

export const LOUNGE_NOTIFICATION_PREF_ROWS = [
  {
    key: 'push_replies',
    label: 'Replies & comments',
    hint: 'Someone commented on your post or replied to you.',
  },
  {
    key: 'push_mentions',
    label: 'Mentions',
    hint: '@you in a post or comment.',
  },
  {
    key: 'push_follows',
    label: 'New followers',
    hint: 'When someone follows you.',
  },
  {
    key: 'push_reposts',
    label: 'Reposts',
    hint: 'Plain or quote reposts of your content.',
  },
  {
    key: 'push_likes',
    label: 'Likes',
    hint: 'Grouped ~10s — one alert per burst on the same post.',
  },
  {
    key: 'push_bookmarks',
    label: 'Bookmarks',
    hint: 'Grouped ~10s like likes.',
  },
  {
    key: 'push_messages',
    label: 'Direct messages',
    hint: 'Coming soon — saved for chat push.',
    disabled: true,
  },
]

function mergePrefs(row) {
  return {
    ...LOUNGE_NOTIFICATION_PREF_DEFAULTS,
    ...(row || {}),
  }
}

export function isLoungeNotificationPrefsSchemaMissingError(error) {
  if (!error) return false
  const code = String(error.code || '')
  const msg = String(error.message || '').toLowerCase()
  if (code === 'PGRST205' || code === '42P01') return true
  if (msg.includes('notification_preferences') && msg.includes('does not exist')) return true
  return false
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} viewerUserId
 */
export async function fetchLoungeNotificationPreferences(supabaseClient, viewerUserId) {
  if (!viewerUserId) return { ...LOUNGE_NOTIFICATION_PREF_DEFAULTS }
  const { data, error } = await supabaseClient
    .from('notification_preferences')
    .select('push_replies, push_mentions, push_follows, push_reposts, push_likes, push_bookmarks, push_messages')
    .eq('user_id', viewerUserId)
    .maybeSingle()
  if (error) throw error
  return mergePrefs(data)
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} viewerUserId
 * @param {Partial<typeof LOUNGE_NOTIFICATION_PREF_DEFAULTS>} patch
 */
export async function upsertLoungeNotificationPreference(supabaseClient, viewerUserId, patch) {
  if (!viewerUserId) return mergePrefs(null)
  const payload = {
    user_id: viewerUserId,
    ...LOUNGE_NOTIFICATION_PREF_DEFAULTS,
    ...patch,
  }
  const { data, error } = await supabaseClient
    .from('notification_preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select('push_replies, push_mentions, push_follows, push_reposts, push_likes, push_bookmarks, push_messages')
    .single()
  if (error) throw error
  return mergePrefs(data)
}
