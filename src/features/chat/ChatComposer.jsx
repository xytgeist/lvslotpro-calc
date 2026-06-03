import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { uploadLoungeFeedPostImage } from '../../utils/communityFeedPost.js'
import {
  focusLoungeComposerCaption,
  scheduleLoungeComposerTextareaFocus,
} from '../lounge/loungeDockComposeFocus.js'
import KlipyGifPicker from '../lounge/KlipyGifPicker.jsx'
import LoungeVideoCropModal from '../lounge/LoungeVideoCropModal.jsx'
import {
  requestCfStreamDirectUpload,
  uploadVideoToCfStreamDirectUrlWithProgress,
  deleteCfStreamOrphanAsset,
  cfStreamPosterUrl,
  probeVideoFileDisplaySize,
  captureVideoFilePosterObjectUrl,
} from '../../utils/loungeVideoUpload.js'

const MAX_BODY   = 4000
const MAX_IMAGES = 9
/** Matches Tailwind `h-10` on the + button (40px border-box). */
const COMPOSER_ROW_H = 40
const COMPOSER_MAX_H = 160
/** Corner radius once the field wraps past one line. */
const COMPOSER_EXPANDED_RADIUS_PX = 20

/**
 * Chat message composer — floating glass bar matching the header style.
 *
 * @param {{
 *   supabaseClient: import('@supabase/supabase-js').SupabaseClient,
 *   viewerUserId: string,
 *   replyTarget: { id: string, body: string, reply_to_preview?: string | null, image_urls?: string[] } | null,
 *   onClearReply: () => void,
 *   onSend: (opts: { body: string, imageUrls: string[], streamVideoUid: string | null, streamPosterUrl: string | null, streamVideoWidth: number | null, streamVideoHeight: number | null, replyToMessageId: string | null }) => Promise<void>,
 *   onTyping: (displayName: string) => void,
 *   viewerDisplayName?: string,
 *   disabled?: boolean,
 *   footerHost?: boolean,
 * }} props
 * @param props.footerHost Parent footer host already applies padding + keyboard overlap.
 */
export default function ChatComposer({
  supabaseClient,
  viewerUserId,
  replyTarget,
  onClearReply,
  onSend,
  onTyping,
  viewerDisplayName = '',
  disabled = false,
  footerHost = false,
}) {
  const [body, setBody]           = useState('')
  const [images, setImages]       = useState(/** @type {string[]} */ ([]))
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState('')
  const [sending, setSending]     = useState(false)
  const [plusOpen, setPlusOpen]   = useState(false)
  const [gifPickerOpen, setGifPickerOpen] = useState(false)
  const [plusRect, setPlusRect]   = useState(/** @type {DOMRect|null} */ (null))
  const [expanded, setExpanded]     = useState(false)
  /** footerHost: no textarea in DOM until tap — matches lounge reply collapsed pill (iOS keyboard). */
  const [composerActive, setComposerActive] = useState(!footerHost)

  // Video state
  const [cropModalFile, setCropModalFile]   = useState(/** @type {File|null} */ (null))
  const [videoUploadProgress, setVideoUploadProgress] = useState(/** @type {number|null} */ (null))
  const [videoMeta, setVideoMeta] = useState(/** @type {{ uid: string, posterUrl: string, localPoster: string|null, width: number|null, height: number|null }|null} */ (null))
  const videoAbortRef = useRef(/** @type {AbortController|null} */ (null))

  const textareaRef    = useRef(null)
  const inputWrapRef   = useRef(null)
  const fileInputRef   = useRef(null)
  const videoInputRef  = useRef(null)
  const plusBtnRef     = useRef(null)

  const hasContent = body.trim().length > 0 || images.length > 0 || videoMeta !== null
  const canSend    = !disabled && !sending && !uploading && !videoUploadProgress && hasContent

  useEffect(() => {
    if (!footerHost) setComposerActive(true)
  }, [footerHost])

  useEffect(() => {
    if (!replyTarget && images.length === 0 && !videoMeta) return
    if (footerHost) {
      flushSync(() => setComposerActive(true))
    } else {
      setComposerActive(true)
    }
  }, [replyTarget, images.length, videoMeta, footerHost])

  const activateAndFocusComposer = useCallback(() => {
    if (disabled) return
    const getTextarea = () => textareaRef.current
    if (footerHost) {
      flushSync(() => setComposerActive(true))
    } else {
      setComposerActive(true)
    }
    focusLoungeComposerCaption(getTextarea)
    scheduleLoungeComposerTextareaFocus({ getTextarea })
  }, [disabled, footerHost])

  const maybeCollapseComposer = useCallback(() => {
    if (!footerHost) return
    window.setTimeout(() => {
      if (body.trim() || images.length > 0 || videoMeta || replyTarget || plusOpen) return
      const ae = document.activeElement
      if (textareaRef.current && ae === textareaRef.current) return
      setComposerActive(false)
    }, 220)
  }, [body, footerHost, images.length, videoMeta, plusOpen, replyTarget])

  // Single line: lock wrapper to h-10 (same as +). Grow only when text wraps.
  useLayoutEffect(() => {
    if (footerHost && !composerActive) return
    const ta = textareaRef.current
    const wrap = inputWrapRef.current
    if (!ta) return

    const prevHeight = ta.style.height
    ta.style.height = 'auto'
    const scrollH = ta.scrollHeight
    ta.style.height = prevHeight

    const lineHeight = parseFloat(getComputedStyle(ta).lineHeight) || 20
    const padY =
      parseFloat(getComputedStyle(ta).paddingTop)
      + parseFloat(getComputedStyle(ta).paddingBottom)
    const lineCount = Math.max(1, Math.round((scrollH - padY) / lineHeight))
    const isMultiLine = body.includes('\n') || lineCount > 1

    setExpanded(isMultiLine)

    if (isMultiLine) {
      const h = Math.max(COMPOSER_ROW_H, Math.min(scrollH, COMPOSER_MAX_H))
      ta.style.height = `${h}px`
      ta.style.lineHeight = ''
      if (wrap) {
        wrap.style.height = ''
        wrap.style.minHeight = `${COMPOSER_ROW_H}px`
        wrap.style.borderRadius = `${COMPOSER_EXPANDED_RADIUS_PX}px`
      }
    } else {
      ta.style.height = '100%'
      ta.style.lineHeight = `${COMPOSER_ROW_H}px`
      if (wrap) {
        wrap.style.height = `${COMPOSER_ROW_H}px`
        wrap.style.minHeight = ''
        wrap.style.borderRadius = '9999px'
      }
    }
  }, [body, composerActive, footerHost])

  const handleBodyChange = (e) => {
    setBody(e.target.value.slice(0, MAX_BODY))
    onTyping(viewerDisplayName)
  }

  const handleImagePick = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (images.length + files.length > MAX_IMAGES) {
      setUploadErr(`Max ${MAX_IMAGES} images per message.`)
      return
    }
    setUploadErr('')
    setUploading(true)
    setPlusOpen(false)
    try {
      const uploaded = await Promise.all(
        files.map((f) => uploadLoungeFeedPostImage(supabaseClient, f, viewerUserId))
      )
      setImages((prev) => [...prev, ...uploaded.map((u) => u.publicUrl)].slice(0, MAX_IMAGES))
    } catch (err) {
      setUploadErr(err?.message || 'Image upload failed.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleKlipyGifPick = ({ gifUrl }) => {
    const url = String(gifUrl || '').trim()
    if (!url) return
    if (images.length >= MAX_IMAGES) {
      setUploadErr(`Max ${MAX_IMAGES} images per message.`)
      return
    }
    setUploadErr('')
    setPlusOpen(false)
    setGifPickerOpen(false)
    setImages((prev) => [...prev, url].slice(0, MAX_IMAGES))
    if (footerHost) setComposerActive(true)
  }

  const removeImage = (url) => setImages((prev) => prev.filter((u) => u !== url))

  const handleVideoPick = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (videoInputRef.current) videoInputRef.current.value = ''
    setPlusOpen(false)
    setCropModalFile(file)
  }

  const handleCropCancel = () => setCropModalFile(null)

  const handleCropConfirm = useCallback(async (result) => {
    // LoungeVideoCropModal with intent='detail' returns a File directly.
    const trimmedFile = result instanceof File ? result : null
    setCropModalFile(null)
    if (!trimmedFile) return

    setUploadErr('')
    setVideoUploadProgress(0)

    const abortCtrl = new AbortController()
    videoAbortRef.current = abortCtrl

    try {
      // Probe dimensions + capture local poster in parallel.
      const [dims, localPoster] = await Promise.all([
        probeVideoFileDisplaySize(trimmedFile),
        captureVideoFilePosterObjectUrl(trimmedFile, { signal: abortCtrl.signal }).catch(() => null),
      ])

      if (abortCtrl.signal.aborted) return

      // Mint a CF Stream direct-upload URL.
      const { uploadURL, uid } = await requestCfStreamDirectUpload(supabaseClient)

      if (abortCtrl.signal.aborted) {
        void deleteCfStreamOrphanAsset(supabaseClient, uid)
        return
      }

      // Upload with progress.
      await uploadVideoToCfStreamDirectUrlWithProgress(uploadURL, trimmedFile, {
        signal: abortCtrl.signal,
        onProgress: (r) => setVideoUploadProgress(Math.round(r * 100)),
      })

      setVideoMeta({
        uid,
        posterUrl: cfStreamPosterUrl(uid),
        localPoster,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
      })
    } catch (e) {
      if (e?.name === 'AbortError') return
      setUploadErr(e?.message || 'Video upload failed.')
    } finally {
      setVideoUploadProgress(null)
      videoAbortRef.current = null
    }
  }, [supabaseClient])

  const removeVideo = useCallback(() => {
    if (videoMeta?.localPoster) URL.revokeObjectURL(videoMeta.localPoster)
    videoAbortRef.current?.abort()
    videoAbortRef.current = null
    setVideoMeta(null)
    setVideoUploadProgress(null)
  }, [videoMeta])

  const handleSend = useCallback(async () => {
    if (!canSend) return
    // Snapshot before clearing so the send payload is correct
    const snapshot = {
      body: body.trim(),
      imageUrls: images,
      streamVideoUid:    videoMeta?.uid    ?? null,
      streamPosterUrl:   videoMeta?.posterUrl ?? null,
      streamVideoWidth:  videoMeta?.width  ?? null,
      streamVideoHeight: videoMeta?.height ?? null,
      replyToMessageId: replyTarget?.id ?? null,
    }
    // Clear immediately — don't wait for the network round-trip
    setBody('')
    setImages([])
    // Dispose local poster blob URL now that we have the CF poster URL
    if (videoMeta?.localPoster) URL.revokeObjectURL(videoMeta.localPoster)
    setVideoMeta(null)
    onClearReply()
    // Keep the keyboard open by refocusing the now-empty textarea
    try {
      textareaRef.current?.focus({ preventScroll: true })
    } catch {
      textareaRef.current?.focus()
    }
    setSending(true)
    try {
      await onSend(snapshot)
    } finally {
      setSending(false)
    }
  }, [canSend, body, images, videoMeta, replyTarget, onSend, onClearReply])

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      void handleSend()
    }
  }

  const openPlus = () => {
    if (footerHost && !composerActive) {
      activateAndFocusComposer()
      return
    }
    const rect = plusBtnRef.current?.getBoundingClientRect()
    if (rect) setPlusRect(rect)
    setPlusOpen(true)
  }

  // Plus-modal position: above the button
  const plusMenuStyle = plusRect ? {
    position: 'fixed',
    bottom: window.innerHeight - plusRect.top + 8,
    left: Math.max(12, plusRect.left - 8),
    width: 180,
    zIndex: 115,
  } : {}

  if (footerHost && !composerActive) {
    return (
      <div className="shrink-0">
        <div className="flex items-center gap-2">
          <button
            ref={plusBtnRef}
            type="button"
            disabled={disabled || uploading}
            onClick={openPlus}
            aria-label="Attach media or GIF"
            className="chat-header-glass shrink-0 flex h-10 w-10 items-center justify-center rounded-full text-zinc-100 touch-manipulation active:opacity-70 transition-opacity disabled:opacity-40"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={activateAndFocusComposer}
            className="chat-header-glass flex h-10 min-w-0 flex-1 touch-manipulation items-center rounded-full px-4 text-left text-[16px] text-zinc-500 active:opacity-80"
          >
            Message…
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={
        footerHost
          ? 'shrink-0'
          : 'shrink-0 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]'
      }
      style={footerHost ? undefined : { paddingTop: 6 }}
    >
      {/* Reply strip */}
      {replyTarget && (
        <div className="chat-header-glass mb-1 flex items-start gap-2 rounded-2xl px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="mt-0.5 shrink-0 text-cyan-400">
              <path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/>
            </svg>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-semibold text-cyan-400">Replying</div>
            <div className="line-clamp-1 text-[12px] text-zinc-400">
              {replyTarget.body || replyTarget.reply_to_preview || '[image]'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClearReply}
            aria-label="Clear reply"
            className="shrink-0 rounded-full p-1 text-zinc-500 touch-manipulation hover:text-zinc-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Image preview strip */}
      {images.length > 0 && (
        <div className="chat-header-glass mb-1 flex gap-2 overflow-x-auto rounded-2xl px-3 py-2">
          {images.map((url) => (
            <div key={url} className="relative shrink-0">
              <img src={url} alt="" className="h-16 w-16 rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url)}
                aria-label="Remove image"
                className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-zinc-900 text-[11px] text-zinc-300 shadow touch-manipulation"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Video preview strip */}
      {(videoMeta || videoUploadProgress !== null) && (
        <div className="chat-header-glass mb-1 flex items-center gap-3 rounded-2xl px-3 py-2">
          <div className="relative shrink-0">
            {videoMeta?.localPoster ? (
              <img src={videoMeta.localPoster} alt="" className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-zinc-800">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="text-zinc-500">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {videoUploadProgress !== null ? (
              <>
                <div className="mb-1.5 text-[12px] text-zinc-400">Uploading… {videoUploadProgress}%</div>
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-700">
                  <div className="h-full rounded-full bg-cyan-500 transition-all" style={{ width: `${videoUploadProgress}%` }} />
                </div>
              </>
            ) : (
              <div className="text-[12px] text-zinc-400">Video ready</div>
            )}
          </div>
          <button
            type="button"
            onClick={removeVideo}
            aria-label="Remove video"
            className="shrink-0 rounded-full p-1 text-zinc-500 touch-manipulation hover:text-zinc-300"
          >
            ×
          </button>
        </div>
      )}

      {uploadErr && (
        <div className="px-1 pb-1 text-[12px] text-rose-400">{uploadErr}</div>
      )}

      {/* Main input row */}
      <div className={`flex gap-2 ${expanded ? 'items-end' : 'items-center'}`}>

        {/* + button */}
        <button
          ref={plusBtnRef}
          type="button"
          disabled={disabled || uploading}
          onClick={openPlus}
          aria-label="Attach media or GIF"
          className="chat-header-glass shrink-0 flex h-10 w-10 items-center justify-center rounded-full text-zinc-100 touch-manipulation active:opacity-70 transition-opacity disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5"  y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Hidden file inputs */}
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagePick} />
        <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoPick} />

        {/* Textarea + inline send button */}
        <div
          ref={inputWrapRef}
          className={`chat-header-glass relative flex flex-1 items-center overflow-hidden ${expanded ? '' : 'h-10'}`}
          style={{ borderRadius: expanded ? COMPOSER_EXPANDED_RADIUS_PX : '9999px' }}
        >
          <textarea
            ref={textareaRef}
            value={body}
            onChange={handleBodyChange}
            onKeyDown={handleKeyDown}
            onBlur={maybeCollapseComposer}
            onFocus={
              footerHost
                ? (e) => {
                    requestAnimationFrame(() => {
                      try {
                        e.currentTarget.focus({ preventScroll: true })
                      } catch {
                        // ignore
                      }
                    })
                  }
                : undefined
            }
            placeholder="Message…"
            disabled={disabled}
            rows={1}
            className={`box-border w-full resize-none bg-transparent py-0 pl-4 text-[16px] text-zinc-100 placeholder:text-zinc-500 outline-none disabled:opacity-50 ${
              expanded ? 'leading-5' : 'h-full overflow-hidden'
            }`}
            style={{
              maxHeight: COMPOSER_MAX_H,
              paddingRight: hasContent ? 46 : 12,
            }}
          />

          {/* Send button — appears inside textarea when content exists */}
          <button
            type="button"
            disabled={!canSend}
            onClick={() => void handleSend()}
            aria-label="Send"
            className={`absolute right-[5px] z-10 grid h-7 w-7 place-items-center rounded-full touch-manipulation transition-all ${
              expanded ? 'bottom-1.5' : 'top-1/2 -translate-y-1/2'
            } ${
              hasContent
                ? 'text-white opacity-100 active:opacity-50'
                : 'pointer-events-none opacity-0'
            }`}
            style={hasContent ? { backgroundColor: '#3b82f6' } : undefined}
          >
            {sending ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Plus modal — portaled above button */}
      {plusOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[114]" onClick={() => setPlusOpen(false)} />
          <div className="chat-menu-glass overflow-hidden rounded-2xl" style={plusMenuStyle}>
            {/* Add Media */}
            <button
              type="button"
              disabled={disabled || uploading || images.length >= MAX_IMAGES || videoMeta !== null || videoUploadProgress !== null}
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-zinc-100 touch-manipulation transition-colors active:bg-white/10 disabled:opacity-40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="shrink-0">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Add Media
            </button>

            <div className="mx-4 h-px bg-white/10" />

            {/* Video */}
            <button
              type="button"
              disabled={disabled || uploading || videoMeta !== null || videoUploadProgress !== null || images.length > 0}
              onClick={() => videoInputRef.current?.click()}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-zinc-100 touch-manipulation transition-colors active:bg-white/10 disabled:opacity-40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="shrink-0">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" />
              </svg>
              Video
            </button>

            <div className="mx-4 h-px bg-white/10" />

            {/* GIF */}
            <button
              type="button"
              disabled={disabled || uploading || images.length >= MAX_IMAGES}
              onClick={() => {
                setPlusOpen(false)
                setGifPickerOpen(true)
              }}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-[15px] font-semibold text-zinc-100 touch-manipulation transition-colors active:bg-white/10 disabled:opacity-40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="3"
                  fill="currentColor"
                  fillOpacity="0.14"
                  stroke="currentColor"
                  strokeWidth="1.75"
                />
                <text
                  x="12"
                  y="15.2"
                  textAnchor="middle"
                  fill="currentColor"
                  style={{ fontSize: '6.5px', fontWeight: 800, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
                >
                  GIF
                </text>
              </svg>
              GIF
            </button>
          </div>
        </>,
        document.body
      )}

      <KlipyGifPicker
        open={gifPickerOpen}
        onClose={() => setGifPickerOpen(false)}
        onPick={handleKlipyGifPick}
        supabaseClient={supabaseClient}
      />

      {cropModalFile && (
        <LoungeVideoCropModal
          file={cropModalFile}
          intent="detail"
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  )
}
