import { useEffect } from 'react'
import LoungeRichComposerField from './LoungeRichComposerField.jsx'
import LoungeMentionDropdown from './LoungeMentionDropdown.jsx'
import LoungePostCategoryPillPicker from './LoungePostCategoryPillPicker.jsx'
import { LoungeImageCarousel } from './LoungePostFeedMedia.jsx'
import { LOUNGE_CAPTION_MAX, LOUNGE_POST_THREAD_MAX_PARTS } from '../../utils/loungeCommentLimits.js'
import { LOUNGE_FEED_AVATAR_CLASS } from './loungeFeedAvatar.js'
import {
  threadComposePartCarouselUrls,
  threadComposePartHasContent,
  threadComposePartHasMedia,
} from '../../utils/loungeThreadComposeMedia.js'

/**
 * Full-screen thread composer — root post + continuation posts, each with optional media/GIF.
 *
 * @param {object} props
 */
export default function LoungeThreadComposeSheet({
  open,
  onRequestClose,
  captions = [''],
  partsMedia = [],
  activePartIndex = 0,
  onFocusPart,
  onChangePart,
  onAddPart,
  onRemovePart,
  registerPartRef,
  getPartRef,
  focusPartIndex = null,
  categoryPills,
  onCategoryPillsChange,
  onSubmit,
  submitting = false,
  error = '',
  charCounterClass,
  composerUserProfile,
  composerUserId,
  composerAuthResolved,
  composerAuthUser,
  avatarToneClass,
  avatarText,
  profileSeedFromUser,
  profileAvatarInitials,
  composerStableInitialsFromUid,
  mentionComposer,
  mentionAnchorRef,
  part0FieldRef,
  pinOnPost,
  onPinOnPostChange,
  showPinToggle = false,
  mediaInputId,
  mediaInputRef,
  mediaInputHandlers,
  onMediaLabelPointerDown,
  onOpenGifPicker,
  onMediaInputChange,
  onRemovePartImageIndex,
  onRemovePartGif,
  onRemovePartVideo,
}) {
  useEffect(() => {
    if (!open || focusPartIndex == null || focusPartIndex < 0) return undefined
    const id = window.setTimeout(() => {
      try {
        getPartRef?.(focusPartIndex)?.focus?.()
      } catch {
        // ignore
      }
    }, 60)
    return () => window.clearTimeout(id)
  }, [focusPartIndex, getPartRef, open, captions.length])

  if (!open) return null

  const canPost =
    captions.some((t, i) => threadComposePartHasContent(t, partsMedia[i])) &&
    !submitting &&
    captions.every((t) => String(t || '').length <= LOUNGE_CAPTION_MAX)

  const activeLabel = captions.length > 1 ? `Post ${activePartIndex + 1}` : null

  return (
    <div
      className="fixed inset-0 z-[96] flex flex-col bg-zinc-950 pt-[max(0px,env(safe-area-inset-top))] pb-[max(0px,env(safe-area-inset-bottom))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lounge-thread-compose-title"
    >
      <header className="flex shrink-0 items-center gap-2 border-b border-zinc-800/90 px-3 py-2.5">
        <button
          type="button"
          disabled={submitting}
          onClick={onRequestClose}
          className="min-h-10 shrink-0 touch-manipulation rounded-full px-3 py-2 text-[15px] font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:opacity-45"
        >
          Cancel
        </button>
        <h2
          id="lounge-thread-compose-title"
          className="min-w-0 flex-1 truncate text-center text-[16px] font-semibold text-white"
        >
          Thread
        </h2>
        <div className="min-h-10 w-[4.75rem] shrink-0" aria-hidden />
      </header>

      {error ? (
        <div className="shrink-0 border-b border-rose-500/25 bg-rose-950/20 px-4 py-2">
          <p className="text-[14px] leading-snug text-rose-200">{error}</p>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <div className="flex items-start gap-3">
          <div className={`${LOUNGE_FEED_AVATAR_CLASS} shrink-0 border-zinc-600`}>
            {composerUserProfile?.avatar_url ? (
              <img
                src={composerUserProfile.avatar_url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : !composerAuthResolved ? (
              <span className="block h-full w-full rounded-full bg-zinc-700/55 animate-pulse" aria-hidden />
            ) : (
              <span
                className={`flex h-full w-full items-center justify-center text-[14px] font-bold text-white ${avatarToneClass(
                  composerUserProfile?.user_id || composerUserId || 'me',
                )}`}
              >
                {(() => {
                  if (composerUserProfile?.display_name?.trim() || composerUserProfile?.handle?.trim()) {
                    return avatarText({ author_profile: composerUserProfile })
                  }
                  if (composerAuthUser) {
                    const seed = profileSeedFromUser(composerAuthUser)
                    return profileAvatarInitials(seed.displayName, seed.baseHandle)
                  }
                  if (composerUserId) return composerStableInitialsFromUid(composerUserId)
                  return avatarText({ author_profile: { display_name: 'Me', handle: '' } })
                })()}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            {captions.map((partText, partIdx) => {
              const partMedia = partsMedia[partIdx]
              const carouselUrls = threadComposePartCarouselUrls(partMedia)
              const imageCount = partMedia?.imageItems?.length ?? 0
              const partGif = String(partMedia?.gifUrl || '').trim()
              const videoSlot = partMedia?.videoSlot ?? null
              const videoPrepHud = partMedia?.videoPrepHud ?? null
              const isActive = partIdx === activePartIndex

              return (
                <div
                  key={`thread-compose-part-${partIdx}`}
                  className={
                    isActive && captions.length > 1
                      ? 'rounded-xl ring-1 ring-cyan-500/25 ring-offset-0 ring-offset-transparent'
                      : undefined
                  }
                >
                  {partIdx > 0 ? (
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[12px] font-semibold text-zinc-500">Post {partIdx + 1}</span>
                      {captions.length > 1 ? (
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => onRemovePart(partIdx)}
                          className="touch-manipulation rounded-md px-1.5 py-0.5 text-[12px] font-semibold text-zinc-500 hover:text-zinc-200 disabled:opacity-45"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {partIdx === 0 ? (
                    <div ref={mentionAnchorRef}>
                      <LoungeRichComposerField
                        ref={(el) => registerPartRef?.(0, el)}
                        variant="feed"
                        autoGrow
                        value={partText}
                        onChange={(next) => onChangePart(partIdx, next)}
                        onFocus={() => onFocusPart?.(partIdx)}
                        maxLength={LOUNGE_CAPTION_MAX}
                        placeholder="Start your thread…"
                        ariaLabel="Thread post 1"
                        disabled={submitting}
                        onKeyDown={(e) =>
                          mentionComposer?.onMentionKeyDown?.(
                            e,
                            (next) => onChangePart(0, next),
                            getPartRef?.(0),
                          )
                        }
                        onKeyUp={mentionComposer?.onCursorMove}
                        onMouseUp={mentionComposer?.onCursorMove}
                        onInput={mentionComposer?.onCursorMove}
                        onBlur={() => window.setTimeout(() => mentionComposer?.clearMention?.(), 150)}
                      />
                      <LoungeMentionDropdown
                        suggestions={mentionComposer?.suggestions ?? []}
                        activeIndex={mentionComposer?.activeIndex ?? 0}
                        loading={mentionComposer?.loading ?? false}
                        onSelect={(p) =>
                          mentionComposer?.onMentionSelect?.(
                            p,
                            (next) => onChangePart(0, next),
                            getPartRef?.(0),
                          )
                        }
                        anchorRef={mentionAnchorRef}
                        caretFieldRef={part0FieldRef}
                      />
                    </div>
                  ) : (
                    <LoungeRichComposerField
                      ref={(el) => registerPartRef?.(partIdx, el)}
                      variant="feed"
                      autoGrow
                      value={partText}
                      onChange={(next) => onChangePart(partIdx, next)}
                      onFocus={() => onFocusPart?.(partIdx)}
                      maxLength={LOUNGE_CAPTION_MAX}
                      placeholder="Continue your thread…"
                      ariaLabel={`Thread post ${partIdx + 1}`}
                      disabled={submitting}
                    />
                  )}
                  <div
                    className={`mt-0.5 text-right text-[12px] tabular-nums ${charCounterClass(String(partText || '').length)}`}
                  >
                    {String(partText || '').length}/{LOUNGE_CAPTION_MAX}
                  </div>
                  {carouselUrls.length > 0 ? (
                    <LoungeImageCarousel
                      urls={carouselUrls}
                      variant="composer"
                      firstMarginTopClass="mt-2"
                      regionAriaLabel={partGif ? 'Post images and GIF' : 'Post images'}
                      removeLabelForIndex={(i) => (i < imageCount ? 'Remove image' : 'Remove GIF')}
                      onRemoveIndex={(i) => {
                        if (i < imageCount) onRemovePartImageIndex?.(partIdx, i)
                        else onRemovePartGif?.(partIdx)
                      }}
                    />
                  ) : null}
                  {videoSlot ? (
                    <div className="relative mt-2 inline-flex max-w-[min(78vw,18rem)] shrink-0 self-start overflow-hidden rounded-xl border border-zinc-700/80 bg-black leading-none">
                      {!videoSlot.file && videoSlot.preview ? (
                        <img
                          src={videoSlot.preview}
                          alt=""
                          className="block h-auto max-h-52 w-auto max-w-[min(78vw,18rem)] object-contain"
                        />
                      ) : videoSlot.preview ? (
                        <video
                          src={videoSlot.preview}
                          poster={videoSlot.posterUrl || undefined}
                          className="block h-auto max-h-52 w-auto max-w-[min(78vw,18rem)] object-contain"
                          controls
                          playsInline
                          preload="metadata"
                          aria-label={`Video preview for post ${partIdx + 1}`}
                        />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onRemovePartVideo?.(partIdx)}
                        disabled={submitting}
                        className="absolute right-1.5 top-1.5 grid h-8 w-8 place-items-center rounded-full border border-zinc-500/35 bg-black/25 text-base leading-none text-zinc-100 shadow-sm backdrop-blur-[2px] touch-manipulation hover:bg-black/45 active:bg-black/55 disabled:opacity-45"
                        aria-label="Remove video"
                        title="Remove video"
                      >
                        ×
                      </button>
                    </div>
                  ) : null}
                  {videoPrepHud &&
                  (videoSlot?.prepStatus === 'preparing' || videoSlot?.prepStatus === 'queued') ? (
                    <div className="mt-2 rounded-lg border border-cyan-500/20 bg-cyan-950/20 px-2.5 py-2">
                      <div className="text-[11px] font-semibold text-cyan-200/90">
                        {videoPrepHud.status || 'Processing video…'}
                      </div>
                      {videoPrepHud.detail ? (
                        <div className="mt-0.5 text-[10px] leading-snug text-zinc-400">{videoPrepHud.detail}</div>
                      ) : null}
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-cyan-500 transition-[width] duration-300 ease-out"
                          style={{ width: `${Math.round((videoPrepHud.progress || 0) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-4 pl-[calc(theme(spacing.3)+2.75rem)]">
          <LoungePostCategoryPillPicker
            value={categoryPills}
            onChange={onCategoryPillsChange}
            disabled={submitting}
            hint=""
          />
        </div>
      </div>

      <footer className="shrink-0 border-t border-zinc-800/90 px-4 py-2.5">
        <input
          id={mediaInputId}
          ref={mediaInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          {...mediaInputHandlers}
          onChange={onMediaInputChange}
        />
        <div className="flex items-center gap-2">
          <label
            htmlFor={mediaInputId}
            onPointerDown={onMediaLabelPointerDown}
            onMouseDown={(e) => e.preventDefault()}
            className="flex shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-md p-1.5 text-sky-400 hover:text-sky-300 active:text-sky-200 disabled:opacity-45 [-webkit-tap-highlight-color:transparent]"
            title={activeLabel ? `Add media to ${activeLabel}` : 'Add media'}
            aria-label={activeLabel ? `Add media to ${activeLabel}` : 'Add media'}
          >
            <svg className="h-8 w-8" viewBox="0 0 20 20" fill="none" aria-hidden>
              <rect
                x="3.75"
                y="3.75"
                width="12.5"
                height="12.5"
                rx="2"
                fill="currentColor"
                fillOpacity="0.14"
                stroke="currentColor"
                strokeWidth="1.35"
              />
              <path
                d="M6.25 13.25 8.25 10.25l1.75 2 2.25-3 3.5 4"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="8" cy="8" r="1" fill="currentColor" />
            </svg>
          </label>
          <button
            type="button"
            disabled={submitting}
            onClick={onOpenGifPicker}
            className="flex shrink-0 touch-manipulation items-center justify-center rounded-md p-1.5 text-sky-400 hover:text-sky-300 active:text-sky-200 disabled:opacity-45 [-webkit-tap-highlight-color:transparent]"
            title={activeLabel ? `Add GIF to ${activeLabel}` : 'Add GIF (Klipy)'}
            aria-label={activeLabel ? `Add GIF to ${activeLabel}` : 'Add GIF'}
          >
            <svg className="h-8 w-8" viewBox="0 0 20 20" fill="none" aria-hidden>
              <rect
                x="3.75"
                y="3.75"
                width="12.5"
                height="12.5"
                rx="2"
                fill="currentColor"
                fillOpacity="0.14"
                stroke="currentColor"
                strokeWidth="1.35"
              />
              <text
                x="10"
                y="12.85"
                textAnchor="middle"
                fill="currentColor"
                style={{ fontSize: '5.35px', fontWeight: 800, fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
              >
                GIF
              </text>
            </svg>
          </button>
          {captions.length < LOUNGE_POST_THREAD_MAX_PARTS ? (
            <button
              type="button"
              disabled={submitting}
              onClick={onAddPart}
              className="flex shrink-0 touch-manipulation items-center justify-center rounded-md p-1.5 text-sky-400 hover:text-sky-300 active:text-sky-200 disabled:opacity-45"
              title="Add post to thread"
              aria-label="Add post to thread"
            >
              <svg className="h-8 w-8" viewBox="0 0 20 20" fill="none" aria-hidden>
                <rect
                  x="3.75"
                  y="3.75"
                  width="12.5"
                  height="12.5"
                  rx="2"
                  fill="currentColor"
                  fillOpacity="0.14"
                  stroke="currentColor"
                  strokeWidth="1.35"
                />
                <path
                  d="M10 6.75v6.5M6.75 10h6.5"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          ) : null}
          {showPinToggle ? (
            <label className="inline-flex cursor-pointer touch-manipulation select-none items-center gap-1.5 rounded-md border border-zinc-700/80 bg-zinc-900/50 px-2 py-1 text-[11px] font-semibold text-zinc-400 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-cyan-500/40">
              <input
                type="checkbox"
                checked={pinOnPost}
                onChange={(e) => onPinOnPostChange?.(e.target.checked)}
                disabled={submitting}
                className="h-3.5 w-3.5 shrink-0 rounded border-zinc-600 bg-zinc-900 text-cyan-600 focus:ring-0"
                aria-label="Pin this thread to the top of the lounge"
              />
              <span className="whitespace-nowrap">Pin</span>
            </label>
          ) : null}
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            {activeLabel && threadComposePartHasMedia(partsMedia[activePartIndex]) ? (
              <span className="hidden min-w-0 truncate text-[11px] font-medium text-cyan-500/80 sm:inline">
                Media on {activeLabel}
              </span>
            ) : null}
            <span className="shrink-0 text-[12px] tabular-nums text-zinc-500">
              {captions.length} / {LOUNGE_POST_THREAD_MAX_PARTS} posts
            </span>
            <button
              type="button"
              disabled={!canPost}
              onClick={() => void onSubmit()}
              className="min-h-8 shrink-0 touch-manipulation rounded-md bg-cyan-600 px-2 py-1 text-[14px] font-bold text-white hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
