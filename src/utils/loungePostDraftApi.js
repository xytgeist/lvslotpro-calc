import { prepareLoungeFeedImageForUpload } from './compressImageForUpload.js'
import { uploadLoungeFeedPostImage } from './communityFeedPost.js'
import { LOUNGE_CAPTION_MAX, LOUNGE_POST_THREAD_MAX_PARTS } from './loungeCommentLimits.js'
import { normalizeLoungePostCategoryPills } from './loungePostCategoryPills.js'
import { buildThreadDraftCaptionsWithSnapshotMediaMarkers } from './loungeThreadComposeDraftMediaMarkers.js'

export const LOUNGE_POST_DRAFTS_MAX = 20
export const LOUNGE_POST_DRAFTS_MAX_IMAGES = 6

const LOUNGE_POST_DRAFT_SELECT_BASE =
  'id, caption, category_pills, gif_url, image_urls, quote_repost_of_post_id, updated_at, created_at'

const LOUNGE_POST_DRAFT_SELECT_WITH_THREAD =
  'id, caption, category_pills, gif_url, image_urls, thread_captions, quote_repost_of_post_id, updated_at, created_at'

function isThreadCaptionsSchemaError(error) {
  const msg = String(error?.message || '')
  return /thread_captions|schema cache|PGRST204/i.test(msg)
}

function normalizeThreadCaptionsForDraft(raw) {
  const parts = Array.isArray(raw)
    ? raw.map((t) => String(t ?? '').slice(0, LOUNGE_CAPTION_MAX))
    : []
  let end = parts.length
  while (end > 1 && !parts[end - 1].trim()) end -= 1
  const trimmed = parts.slice(0, Math.min(end, LOUNGE_POST_THREAD_MAX_PARTS))
  if (trimmed.length <= 1) {
    return { caption: trimmed[0] || '', threadCaptions: [] }
  }
  return { caption: trimmed[0], threadCaptions: trimmed }
}

/** @typedef {{
 *   id: string,
 *   caption: string,
 *   category_pills: string[],
 *   gif_url: string,
 *   image_urls: string[],
 *   thread_captions: string[],
 *   quote_repost_of_post_id: string | null,
 *   updated_at: string,
 *   created_at: string,
 * }} LoungePostDraftRow */

function normalizeDraftRow(row) {
  if (!row?.id) return null
  let imageUrls = row.image_urls
  if (typeof imageUrls === 'string') {
    try {
      imageUrls = JSON.parse(imageUrls)
    } catch {
      imageUrls = []
    }
  }
  const threadCaptions = Array.isArray(row.thread_captions)
    ? row.thread_captions.map((t) => String(t ?? '').slice(0, LOUNGE_CAPTION_MAX))
    : []
  const normalizedThread = normalizeThreadCaptionsForDraft(threadCaptions)
  return {
    id: String(row.id),
    caption: String(row.caption ?? normalizedThread.caption).slice(0, LOUNGE_CAPTION_MAX),
    category_pills: normalizeLoungePostCategoryPills(row.category_pills),
    gif_url: String(row.gif_url ?? '').trim().slice(0, 2048),
    image_urls: Array.isArray(imageUrls)
      ? imageUrls.map((u) => String(u ?? '').trim()).filter(Boolean).slice(0, LOUNGE_POST_DRAFTS_MAX_IMAGES)
      : [],
    thread_captions:
      normalizedThread.threadCaptions.length > 1
        ? normalizedThread.threadCaptions
        : [],
    quote_repost_of_post_id: row.quote_repost_of_post_id ? String(row.quote_repost_of_post_id) : null,
    updated_at: String(row.updated_at ?? ''),
    created_at: String(row.created_at ?? ''),
  }
}

/** True when the draft should restore into the thread compose sheet. */
export function loungePostDraftIsThread(draft) {
  return Array.isArray(draft?.thread_captions) && draft.thread_captions.length > 1
}

/**
 * Build draft upsert payload from a captured Lounge post snapshot (text/images; no video).
 *
 * @param {object} snapshot
 * @param {{ fromPartIndex?: number }} [opts] When set, only captions from this part index onward (partial publish recovery).
 */
export function loungePostDraftPayloadFromSubmissionSnapshot(snapshot, opts = {}) {
  if (!snapshot || typeof snapshot !== 'object') return null
  const fromIdx = Math.max(0, Number(opts.fromPartIndex) || 0)
  let threadCaptions = []
  let snapshotParts = null
  if (Array.isArray(snapshot.threadParts) && snapshot.threadParts.length > 1) {
    snapshotParts = snapshot.threadParts
    threadCaptions = snapshot.threadParts.map((p) => String(p?.body ?? ''))
  } else if (Array.isArray(snapshot.threadCaptions) && snapshot.threadCaptions.length > 1) {
    threadCaptions = snapshot.threadCaptions.map((t) => String(t ?? ''))
  }
  if (threadCaptions.length > 1 && fromIdx > 0) {
    threadCaptions = threadCaptions.slice(fromIdx)
    if (snapshotParts) snapshotParts = snapshotParts.slice(fromIdx)
  }
  if (threadCaptions.length > 1 && snapshotParts) {
    threadCaptions = buildThreadDraftCaptionsWithSnapshotMediaMarkers(threadCaptions, snapshotParts)
  }
  const rootPart =
    Array.isArray(snapshot.threadParts) && snapshot.threadParts.length > 0
      ? snapshot.threadParts[fromIdx > 0 ? fromIdx : 0]
      : null
  const gifUrl = rootPart
    ? String(rootPart.gifUrl ?? '').trim()
    : String(snapshot.gifOnlyUrl ?? '').trim()
  const existingImageUrls = rootPart
    ? (Array.isArray(rootPart.existingImageUrls)
        ? rootPart.existingImageUrls.map((u) => String(u ?? '').trim()).filter(Boolean)
        : [])
    : Array.isArray(snapshot.existingImageUrls)
      ? snapshot.existingImageUrls.map((u) => String(u ?? '').trim()).filter(Boolean)
      : []
  const imageFiles = rootPart
    ? (Array.isArray(rootPart.imageFiles) ? rootPart.imageFiles.filter((f) => f instanceof File) : [])
    : Array.isArray(snapshot.imageFiles)
      ? snapshot.imageFiles.filter((f) => f instanceof File)
      : []
  const caption = threadCaptions.length > 1 ? threadCaptions[0] : String(snapshot.caption ?? '')
  return {
    id: snapshot.savedDraftId || null,
    caption,
    threadCaptions: threadCaptions.length > 1 ? threadCaptions : undefined,
    categoryPills: snapshot.categoryPills,
    gifUrl,
    existingImageUrls,
    imageFiles,
  }
}

/** Ordered caption parts for thread compose restore. */
export function loungePostDraftThreadParts(draft) {
  if (!loungePostDraftIsThread(draft)) return []
  return draft.thread_captions.map((t) => String(t ?? '').slice(0, LOUNGE_CAPTION_MAX))
}

export function loungePostDraftHasContent({
  caption = '',
  gifUrl = '',
  imageUrls = [],
  imageFiles = [],
  threadCaptions = [],
} = {}) {
  const parts = Array.isArray(threadCaptions) ? threadCaptions : []
  if (parts.some((t) => String(t || '').trim().length > 0)) return true
  return (
    String(caption || '').trim().length > 0 ||
    String(gifUrl || '').trim().length > 0 ||
    (Array.isArray(imageUrls) && imageUrls.length > 0) ||
    (Array.isArray(imageFiles) && imageFiles.length > 0)
  )
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @returns {Promise<{ data: LoungePostDraftRow[], error: Error | null }>}
 */
export async function listLoungePostDrafts(supabaseClient) {
  let { data, error } = await supabaseClient
    .from('lounge_post_drafts')
    .select(LOUNGE_POST_DRAFT_SELECT_WITH_THREAD)
    .order('updated_at', { ascending: false })
    .limit(LOUNGE_POST_DRAFTS_MAX)

  if (error && isThreadCaptionsSchemaError(error)) {
    ;({ data, error } = await supabaseClient
      .from('lounge_post_drafts')
      .select(LOUNGE_POST_DRAFT_SELECT_BASE)
      .order('updated_at', { ascending: false })
      .limit(LOUNGE_POST_DRAFTS_MAX))
  }

  if (error) return { data: [], error: new Error(error.message || 'Could not load drafts.') }
  return {
    data: (data || []).map(normalizeDraftRow).filter(Boolean),
    error: null,
  }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @returns {Promise<{ count: number, error: Error | null }>}
 */
export async function countLoungePostDrafts(supabaseClient) {
  const { count, error } = await supabaseClient
    .from('lounge_post_drafts')
    .select('id', { count: 'exact', head: true })

  if (error) return { count: 0, error: new Error(error.message || 'Could not count drafts.') }
  return { count: typeof count === 'number' ? count : 0, error: null }
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {string} draftId
 */
export async function deleteLoungePostDraft(supabaseClient, draftId) {
  const id = String(draftId || '').trim()
  if (!id) return { error: new Error('Missing draft id.') }
  const { error } = await supabaseClient.from('lounge_post_drafts').delete().eq('id', id)
  if (error) return { error: new Error(error.message || 'Could not delete draft.') }
  return { error: null }
}

async function uploadDraftImageFiles(supabaseClient, user, imageFiles, signal) {
  const files = Array.isArray(imageFiles) ? imageFiles.filter((f) => f instanceof File) : []
  const urls = []
  for (let i = 0; i < files.length; i += 1) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    const { file: ready, error: cErr } = await prepareLoungeFeedImageForUpload(files[i])
    if (cErr) throw new Error(cErr.message)
    const { data: upUrl, error: upErr } = await uploadLoungeFeedPostImage({
      supabaseClient,
      user,
      file: ready,
      signal,
    })
    if (upErr) throw new Error(upErr.message || 'Could not upload draft image.')
    if (!upUrl) throw new Error('Could not upload draft image.')
    urls.push(upUrl)
  }
  return urls
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabaseClient
 * @param {{
 *   id?: string | null,
 *   caption?: string,
 *   categoryPills?: string[],
 *   gifUrl?: string,
 *   existingImageUrls?: string[],
 *   imageFiles?: File[],
 *   threadCaptions?: string[],
 *   quoteRepostOfPostId?: string | null,
 *   signal?: AbortSignal,
 * }} payload
 * @returns {Promise<{ data: LoungePostDraftRow | null, error: Error | null }>}
 */
export async function upsertLoungePostDraft(supabaseClient, payload = {}) {
  const threadInput = Array.isArray(payload.threadCaptions) ? payload.threadCaptions : null
  const normalizedThread = threadInput
    ? normalizeThreadCaptionsForDraft(threadInput)
    : normalizeThreadCaptionsForDraft([payload.caption ?? ''])
  const caption = normalizedThread.threadCaptions.length > 1
    ? String(normalizedThread.threadCaptions[0] ?? '').slice(0, LOUNGE_CAPTION_MAX)
    : String(payload.caption ?? normalizedThread.caption ?? '')
        .trim()
        .slice(0, LOUNGE_CAPTION_MAX)
  const threadCaptions = normalizedThread.threadCaptions
  const gifUrl = String(payload.gifUrl ?? '').trim().slice(0, 2048)
  const categoryPills = normalizeLoungePostCategoryPills(payload.categoryPills)
  const existingImageUrls = Array.isArray(payload.existingImageUrls)
    ? payload.existingImageUrls.map((u) => String(u ?? '').trim()).filter(Boolean)
    : []
  const quoteRepostOfPostId = payload.quoteRepostOfPostId
    ? String(payload.quoteRepostOfPostId).trim()
    : null

  if (
    !loungePostDraftHasContent({
      caption,
      gifUrl,
      imageUrls: existingImageUrls,
      imageFiles: payload.imageFiles,
      threadCaptions,
    })
  ) {
    return { data: null, error: new Error('Add caption text, a GIF, or at least one image before saving.') }
  }

  const {
    data: { session },
  } = await supabaseClient.auth.getSession()
  if (!session?.user) {
    return { data: null, error: new Error('You must be signed in to save drafts.') }
  }

  let uploadedUrls = []
  try {
    uploadedUrls = await uploadDraftImageFiles(
      supabaseClient,
      session.user,
      payload.imageFiles,
      payload.signal,
    )
  } catch (e) {
    if (e?.name === 'AbortError') throw e
    return { data: null, error: e instanceof Error ? e : new Error('Could not upload draft images.') }
  }

  const imageUrls = [...existingImageUrls, ...uploadedUrls].slice(0, LOUNGE_POST_DRAFTS_MAX_IMAGES)

  const row = {
    caption,
    category_pills: categoryPills,
    gif_url: gifUrl,
    image_urls: imageUrls,
    thread_captions: threadCaptions,
    quote_repost_of_post_id: quoteRepostOfPostId || null,
  }

  const draftId = String(payload.id || '').trim()

  async function writeDraft(includeThreadCaptions) {
    const writeRow = includeThreadCaptions
      ? row
      : {
          caption: row.caption,
          category_pills: row.category_pills,
          gif_url: row.gif_url,
          image_urls: row.image_urls,
          quote_repost_of_post_id: row.quote_repost_of_post_id,
        }
    const selectCols = includeThreadCaptions
      ? LOUNGE_POST_DRAFT_SELECT_WITH_THREAD
      : LOUNGE_POST_DRAFT_SELECT_BASE

    if (draftId) {
      return supabaseClient
        .from('lounge_post_drafts')
        .update(writeRow)
        .eq('id', draftId)
        .select(selectCols)
        .maybeSingle()
    }
    return supabaseClient.from('lounge_post_drafts').insert(writeRow).select(selectCols).single()
  }

  if (threadCaptions.length > 1) {
    let { data, error } = await writeDraft(true)
    if (error && isThreadCaptionsSchemaError(error)) {
      return {
        data: null,
        error: new Error(
          'Thread drafts need the latest Supabase migration (20260608160000_lounge_post_drafts_thread_captions.sql).',
        ),
      }
    }
    if (error) return { data: null, error: new Error(error.message || 'Could not save draft.') }
    if (!data && draftId) return { data: null, error: new Error('Draft not found.') }
    return { data: normalizeDraftRow(data), error: null }
  }

  let { data, error } = await writeDraft(true)
  if (error && isThreadCaptionsSchemaError(error)) {
    ;({ data, error } = await writeDraft(false))
  }

  if (error) {
    const msg = String(error.message || '')
    if (msg.includes('Draft limit reached')) {
      return { data: null, error: new Error('Draft limit reached (20). Delete an old draft first.') }
    }
    return { data: null, error: new Error(error.message || 'Could not save draft.') }
  }
  if (!data && draftId) return { data: null, error: new Error('Draft not found.') }

  return { data: normalizeDraftRow(data), error: null }
}

/** One-line preview for draft list rows. */
export function loungePostDraftPreviewText(draft, maxLen = 120) {
  if (loungePostDraftIsThread(draft)) {
    const first = String(draft.thread_captions[0] || '').trim()
    const suffix = ` · Thread · ${draft.thread_captions.length} parts`
    if (first) {
      const room = Math.max(8, maxLen - suffix.length)
      const oneLine = first.split('\n')[0].trim()
      if (oneLine.length <= room) return `${oneLine}${suffix}`
      return `${oneLine.slice(0, room - 1)}…${suffix}`
    }
    return `Thread · ${draft.thread_captions.length} parts`
  }
  const cap = String(draft?.caption || '').trim()
  if (cap) {
    const oneLine = cap.split('\n')[0].trim()
    if (oneLine.length <= maxLen) return oneLine
    return `${oneLine.slice(0, maxLen - 1)}…`
  }
  if (Array.isArray(draft?.image_urls) && draft.image_urls.length > 0) {
    const n = draft.image_urls.length
    return n === 1 ? 'Photo draft' : `${n} photos`
  }
  if (String(draft?.gif_url || '').trim()) return 'GIF draft'
  return 'Empty draft'
}

export function formatLoungePostDraftWhen(iso) {
  if (!iso) return ''
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return ''
  try {
    return new Date(t).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}
