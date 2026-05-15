import { formatCompactStatCount, fullStatCountTitle } from '../../utils/formatCompactStatCount.js'
import LoungeFeedStatSlot from './LoungeFeedStatSlot.jsx'
import LoungeFlameIcon from './LoungeFlameIcon.jsx'

/**
 * Twitter-style stat row under a comment body. Only **reply** is wired; like/repost/bookmark match post UI but are inactive (comments are not posts in our schema).
 */
export default function LoungeCommentInteractionBar({
  loungeReadOnly,
  replyCount,
  onReply,
  requireLoungeAuth,
  openProfileGateIfNeeded,
}) {
  const ro = loungeReadOnly
  const commentClass = 'text-zinc-500'
  const repostClass = 'text-zinc-500'
  const likeClass = 'text-zinc-500'
  const bookmarkClass = 'text-zinc-500'
  const rc = typeof replyCount === 'number' ? replyCount : 0

  return (
    <div
      className="mt-1 flex w-full min-w-0 flex-nowrap items-center justify-between gap-x-1 text-[15px]"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="group"
    >
      <LoungeFeedStatSlot
        readOnly={ro}
        title={ro ? 'Sign in to reply' : 'Reply'}
        onReadOnlyClick={requireLoungeAuth}
        onClick={() => {
          if (openProfileGateIfNeeded()) return
          onReply?.()
        }}
        className="inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-zinc-900/80 touch-manipulation [-webkit-tap-highlight-color:transparent]"
      >
        <span className="flex w-[22px] shrink-0 justify-center">
          <svg
            className={`block h-[22px] w-[22px] origin-center scale-y-[1.1] ${commentClass}`}
            viewBox="0 0 20 20"
            aria-hidden
          >
            <path
              d="M4.75 5.75h10.5a1.5 1.5 0 011.5 1.5v5a1.5 1.5 0 01-1.5 1.5H9l-3.25 2v-2H4.75a1.5 1.5 0 01-1.5-1.5v-5a1.5 1.5 0 011.5-1.5z"
              fill="currentColor"
            />
          </svg>
        </span>
        {rc > 0 ? (
          <span className={commentClass} title={fullStatCountTitle(rc)}>
            {formatCompactStatCount(rc)}
          </span>
        ) : null}
      </LoungeFeedStatSlot>

      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-zinc-600 opacity-[0.42] select-none"
        title="Reposts apply to posts"
        aria-hidden
      >
        <svg className={`h-[22px] w-[22px] ${repostClass}`} viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d="M6 6h8l-1.75-1.75M14 14H6l1.75 1.75M14 6l2 2-2 2M6 14l-2-2 2-2"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-zinc-600 opacity-[0.42] select-none"
        title="Likes on comments are not available yet"
        aria-hidden
      >
        <LoungeFlameIcon className={`h-[22px] w-[22px] ${likeClass}`} readOnly />
      </span>

      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-zinc-600 opacity-[0.42] select-none"
        title="Bookmarks apply to posts"
        aria-hidden
      >
        <svg className={`h-[24px] w-[24px] ${bookmarkClass}`} viewBox="0 0 20 20" aria-hidden>
          <path
            d="M6.5 4.75h7a1 1 0 011 1v9.5L10 12.75 5.5 15.25v-9.5a1 1 0 011-1z"
            fill="currentColor"
          />
        </svg>
      </span>
    </div>
  )
}
