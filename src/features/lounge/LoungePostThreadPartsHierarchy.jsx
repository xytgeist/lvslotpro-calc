import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import {
  profileAvatarInitials,
  profileAvatarToneClass,
} from '../profiles/profileGate'
import { LoungeCommentCard } from './LoungePostCommentThread.jsx'
import {
  LOUNGE_THREAD_PART_NUMBER_BADGE_CLASS,
  LOUNGE_THREAD_PART_NUMBER_BADGE_LAST_CLASS,
} from './LoungePostDetailCommentHierarchy.jsx'
import { LOUNGE_FEED_POST_DETAIL_COMMENT_AVATAR_CLASS } from './loungeFeedAvatar.js'
import { feedThreadPartDisplayNumber } from '../../utils/loungePostThreadApi.js'

const AVATAR_RAIL_W = 'w-12 sm:w-[3.3rem]'
const THREAD_AVATAR_GAP_PX = 8
const THREAD_LINE_CLASS = 'pointer-events-none absolute z-0 w-[2px] rounded-full bg-zinc-700/90'

function useMeasuredThreadLine(containerRef, fromRef, toRef, { startPadPx = 0, endPadPx = THREAD_AVATAR_GAP_PX } = {}) {
  const [line, setLine] = useState(null)

  const updateLine = useCallback(() => {
    const container = containerRef?.current
    const fromEl = fromRef?.current
    const toEl = toRef?.current
    if (!container || !fromEl || !toEl) {
      setLine(null)
      return
    }
    const cRect = container.getBoundingClientRect()
    const fr = fromEl.getBoundingClientRect()
    const tr = toEl.getBoundingClientRect()
    const x = (fr.left + fr.right) / 2 - cRect.left
    const yStart = fr.bottom - cRect.top + startPadPx
    const yEnd = tr.top - cRect.top - endPadPx
    if (yEnd <= yStart) {
      setLine(null)
      return
    }
    setLine({ left: x, top: yStart, height: yEnd - yStart })
  }, [containerRef, endPadPx, fromRef, startPadPx, toRef])

  useLayoutEffect(() => {
    updateLine()
    const raf = requestAnimationFrame(updateLine)
    const container = containerRef?.current
    if (!container || typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateLine)
      return () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', updateLine)
      }
    }
    const ro = new ResizeObserver(() => updateLine())
    ro.observe(container)
    window.addEventListener('resize', updateLine)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('resize', updateLine)
    }
  }, [containerRef, updateLine])

  return line
}

function ThreadMeasuredLine({ containerRef, fromRef, toRef, startPadPx, endPadPx }) {
  const line = useMeasuredThreadLine(containerRef, fromRef, toRef, { startPadPx, endPadPx })
  if (!line) return null
  return (
    <div
      aria-hidden
      className={THREAD_LINE_CLASS}
      style={{
        left: line.left,
        top: line.top,
        height: line.height,
        transform: 'translateX(-50%)',
      }}
    />
  )
}

/** Badge bottom → next part avatar top. */
function ThreadPartOutgoingLine({ containerRef, badgeRef, nextAvatarRef }) {
  return (
    <ThreadMeasuredLine
      containerRef={containerRef}
      fromRef={badgeRef}
      toRef={nextAvatarRef}
      startPadPx={0}
      endPadPx={THREAD_AVATAR_GAP_PX}
    />
  )
}

function ThreadPartAvatarButton({ comment, avatarButtonRef, onAvatarClickProfile, openProfileGateIfNeeded }) {
  const profile = comment?.author_profile
  const displayName = profile?.display_name || profile?.handle || 'Member'

  return (
    <button
      ref={avatarButtonRef}
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        if (openProfileGateIfNeeded?.()) return
        onAvatarClickProfile?.(comment)
      }}
      className={`${LOUNGE_FEED_POST_DETAIL_COMMENT_AVATAR_CLASS} flex items-center justify-center touch-manipulation hover:border-zinc-600 [-webkit-tap-highlight-color:transparent]`}
      aria-label={`Open profile for ${displayName}`}
    >
      {profile?.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt=""
          className="h-full w-full rounded-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center font-bold text-white ${profileAvatarToneClass(
            profile?.user_id || profile?.handle || comment?.user_id || 'member',
          )}`}
        >
          {profileAvatarInitials(profile?.display_name, profile?.handle)}
        </span>
      )}
    </button>
  )
}

function ThreadPartRow({
  comment,
  partNumber,
  isLast,
  nextAvatarRef,
  connectorRootRef,
  avatarRef,
  cardProps,
  descendantFallback,
  onOpenCommentThread,
}) {
  const badgeRef = useRef(null)
  const openProfileGateIfNeeded = cardProps.openProfileGateIfNeeded

  return (
    <div className="mt-3.5">
      <div className="flex items-start gap-3">
        <div className={`flex ${AVATAR_RAIL_W} shrink-0 flex-col items-center`}>
          <ThreadPartAvatarButton
            comment={comment}
            avatarButtonRef={avatarRef}
            onAvatarClickProfile={cardProps.onAvatarClickProfile}
            openProfileGateIfNeeded={openProfileGateIfNeeded}
          />
          <div className="mb-2 mt-2 flex w-full flex-col items-center">
            <span
              ref={badgeRef}
              className={
                isLast ? LOUNGE_THREAD_PART_NUMBER_BADGE_LAST_CLASS : LOUNGE_THREAD_PART_NUMBER_BADGE_CLASS
              }
              title={isLast ? 'Last part' : undefined}
              aria-hidden
            >
              {partNumber}
            </span>
          </div>
        </div>
        <div className="relative z-[1] min-w-0 flex-1">
          <LoungeCommentCard
            comment={comment}
            hideAvatar
            avatarButtonRef={avatarRef}
            descendantFallback={descendantFallback}
            {...cardProps}
            navigable={Boolean(onOpenCommentThread)}
            onOpenCommentThread={
              onOpenCommentThread ? () => onOpenCommentThread(comment) : undefined
            }
          />
        </div>
      </div>
      {connectorRootRef && nextAvatarRef ? (
        <ThreadPartOutgoingLine
          containerRef={connectorRootRef}
          badgeRef={badgeRef}
          nextAvatarRef={nextAvatarRef}
        />
      ) : null}
    </div>
  )
}

/**
 * Post detail — thread parts 2+ with the same flex avatar rail as `LoungeThreadComposeSheet`.
 * Outgoing connectors are measured badge-bottom → next-avatar-top inside `connectorRootRef`.
 */
export default function LoungePostThreadPartsHierarchy({
  threadParts = [],
  connectorRootRef = null,
  descendantCountByCommentId,
  onOpenCommentThread,
  cardProps = {},
}) {
  const avatarRefs = useRef([])

  if (!threadParts.length) return null

  avatarRefs.current = threadParts.map((c, i) => avatarRefs.current[i] || { current: null })

  return (
    <section aria-label="Thread">
      {threadParts.map((comment, idx) => (
        <ThreadPartRow
          key={comment.id}
          comment={comment}
          partNumber={feedThreadPartDisplayNumber(comment)}
          isLast={idx === threadParts.length - 1}
          nextAvatarRef={
            idx < threadParts.length - 1 ? avatarRefs.current[idx + 1] : null
          }
          connectorRootRef={connectorRootRef}
          avatarRef={avatarRefs.current[idx]}
          cardProps={cardProps}
          descendantFallback={descendantCountByCommentId?.get(comment.id) ?? 0}
          onOpenCommentThread={onOpenCommentThread}
        />
      ))}
    </section>
  )
}
