import { feedPostDisplayCaption, feedPostImageUrls, feedPostStreamPosterUrl } from './communityFeedPost.js'
import { normalizeFeedCommentBody } from './communityFeedComment.js'
import { LOUNGE_ACTIVITY_EVENT_TYPES } from './loungeActivityApi.js'

const POST_PREVIEW_COLS =
  'id,caption,image_urls,media_url,gif_url,stream_poster_url'

const COMMENT_PREVIEW_COLS =
  'id,body,image_urls,media_url,gif_url,stream_poster_url'

/** Event types that show actor text snippet + optional media poster. */
export function loungeActivityShowsContextPreview(eventType) {
  switch (eventType) {
    case LOUNGE_ACTIVITY_EVENT_TYPES.COMMENT_ON_POST:
    case LOUNGE_ACTIVITY_EVENT_TYPES.REPLY_TO_COMMENT:
    case LOUNGE_ACTIVITY_EVENT_TYPES.MENTION_IN_POST:
    case LOUNGE_ACTIVITY_EVENT_TYPES.MENTION_IN_COMMENT:
    case LOUNGE_ACTIVITY_EVENT_TYPES.QUOTE_REPOST:
      return true
    default:
      return false
  }
}

/** First image / GIF / Stream poster for a feed post or comment row. */
export function loungeActivityPreviewPosterUrl(row) {
  if (!row) return null
  const poster = feedPostStreamPosterUrl(row)
  if (poster) return poster
  const imgs = feedPostImageUrls(row)
  if (imgs[0]) return imgs[0]
  const gif = String(row?.gif_url ?? '').trim()
  if (gif) return gif
  const media = String(row?.media_url ?? '').trim()
  if (media) return media
  return null
}

function previewTextFromRow(eventType, postRow, commentRow) {
  if (
    eventType === LOUNGE_ACTIVITY_EVENT_TYPES.MENTION_IN_POST ||
    eventType === LOUNGE_ACTIVITY_EVENT_TYPES.QUOTE_REPOST
  ) {
    return feedPostDisplayCaption(postRow)
  }
  if (commentRow?.body) {
    return normalizeFeedCommentBody(commentRow.body)
  }
  return ''
}

/**
 * Batch-fetch post/comment preview fields for notification rows.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {Array<object>} events
 */
export async function hydrateLoungeActivityEventPreviews(supabaseClient, events) {
  if (!supabaseClient || !Array.isArray(events) || events.length === 0) return events

  const postIds = new Set()
  const commentIds = new Set()

  for (const event of events) {
    if (!loungeActivityShowsContextPreview(event?.event_type)) continue
    if (
      event.event_type === LOUNGE_ACTIVITY_EVENT_TYPES.MENTION_IN_POST ||
      event.event_type === LOUNGE_ACTIVITY_EVENT_TYPES.QUOTE_REPOST
    ) {
      if (event.post_id) postIds.add(String(event.post_id))
    }
    if (event.comment_id) {
      commentIds.add(String(event.comment_id))
    }
  }

  const postsById = new Map()
  const commentsById = new Map()

  if (postIds.size > 0) {
    const { data } = await supabaseClient
      .from('community_feed_posts')
      .select(POST_PREVIEW_COLS)
      .in('id', [...postIds])
      .is('hidden_at', null)
    for (const row of data || []) {
      postsById.set(String(row.id), row)
    }
  }

  if (commentIds.size > 0) {
    const { data } = await supabaseClient
      .from('feed_comments')
      .select(COMMENT_PREVIEW_COLS)
      .in('id', [...commentIds])
      .is('hidden_at', null)
    for (const row of data || []) {
      commentsById.set(String(row.id), row)
    }
  }

  return events.map((event) => {
    if (!loungeActivityShowsContextPreview(event?.event_type)) return event
    const postRow =
      event.post_id && postsById.has(String(event.post_id))
        ? postsById.get(String(event.post_id))
        : null
    const commentRow =
      event.comment_id && commentsById.has(String(event.comment_id))
        ? commentsById.get(String(event.comment_id))
        : null
    const sourceRow =
      event.event_type === LOUNGE_ACTIVITY_EVENT_TYPES.MENTION_IN_POST ||
      event.event_type === LOUNGE_ACTIVITY_EVENT_TYPES.QUOTE_REPOST
        ? postRow
        : commentRow || postRow
    const previewText = previewTextFromRow(event.event_type, postRow, commentRow)
    const previewPosterUrl = loungeActivityPreviewPosterUrl(sourceRow)
    if (!previewText && !previewPosterUrl) return event
    return {
      ...event,
      preview_text: previewText || '',
      preview_poster_url: previewPosterUrl || null,
    }
  })
}
