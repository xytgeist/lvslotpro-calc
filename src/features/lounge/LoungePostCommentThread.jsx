import { useMemo } from 'react'
import {
  profileAvatarInitials,
  profileAvatarToneClass,
} from '../profiles/profileGate'
import LoungeStaffRoleBadge from './LoungeStaffRoleBadge'
import LoungeOgBadge from './LoungeOgBadge'
import LoungeCommentInteractionBar from './LoungeCommentInteractionBar.jsx'

function CommentAvatar({ profile, comment, className }) {
  if (profile?.avatar_url) {
    return <img src={profile.avatar_url} alt="" className={`${className} object-cover`} />
  }
  return (
    <span
      className={`grid place-items-center font-bold text-white ${profileAvatarToneClass(
        profile?.user_id || profile?.handle || comment?.user_id || 'member',
      )} ${className}`}
    >
      {profileAvatarInitials(profile?.display_name, profile?.handle)}
    </span>
  )
}

/**
 * @param {boolean} navigable — Whole row opens the comment thread (not nested interactive buttons except avatar).
 */
function LoungeCommentCard({
  comment,
  postAuthorUserId,
  postAgeLabel,
  navigable,
  onOpenCommentThread,
  onAvatarClickProfile,
  directReplyCount = 0,
  loungeReadOnly = false,
  requireLoungeAuth,
  openProfileGateIfNeeded,
  onCommentReplyInteraction,
}) {
  const profile = comment.author_profile
  const displayName = profile?.display_name || profile?.handle || 'Member'
  const avatarClass =
    'h-9 w-9 shrink-0 overflow-hidden rounded-full border border-zinc-800 bg-zinc-900 font-bold text-zinc-200 text-[13px]'
  const isPostAuthor = Boolean(postAuthorUserId && comment.user_id === postAuthorUserId)

  const metaRow = (
    <div className="flex min-w-0 flex-1 items-start gap-2.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onAvatarClickProfile?.(comment)
        }}
        className="shrink-0 touch-manipulation [-webkit-tap-highlight-color:transparent]"
        aria-label={`Open profile for ${displayName}`}
      >
        <CommentAvatar profile={profile} comment={comment} className={avatarClass} />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center justify-between gap-2 text-[13px] text-zinc-500">
          <span className="flex min-w-0 items-center gap-1.5 truncate font-semibold text-zinc-300">
            <span className="min-w-0 truncate">{displayName}</span>
            {isPostAuthor ? (
              <span className="shrink-0 rounded-md bg-violet-950/50 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-violet-300">
                Author
              </span>
            ) : null}
            <LoungeStaffRoleBadge role={profile?.role} size="detail" />
            <LoungeOgBadge isOg={profile?.is_og} size="detail" />
          </span>
          <span className="shrink-0 tabular-nums">{postAgeLabel(comment.created_at)}</span>
        </div>
        <p className="mt-0.5 whitespace-pre-wrap break-words text-[15px] leading-snug text-zinc-100">
          {comment.body}
        </p>
        <LoungeCommentInteractionBar
          loungeReadOnly={loungeReadOnly}
          replyCount={directReplyCount}
          requireLoungeAuth={requireLoungeAuth}
          openProfileGateIfNeeded={openProfileGateIfNeeded}
          onReply={() => onCommentReplyInteraction?.(comment)}
        />
      </div>
    </div>
  )

  if (navigable && onOpenCommentThread) {
    return (
      <article
        role="button"
        tabIndex={0}
        onClick={() => onOpenCommentThread(comment)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onOpenCommentThread(comment)
          }
        }}
        className="min-w-0 cursor-pointer rounded-lg px-1 py-1 touch-manipulation outline-none hover:bg-zinc-900/50 [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-violet-500/40"
      >
        {metaRow}
      </article>
    )
  }

  return <article className="min-w-0 px-1 py-1">{metaRow}</article>
}

/**
 * Post detail comments — roots tap through into threaded replies on separate drill-down screens.
 *
 * @param {'post' | 'commentDetail'} variant
 * @param {string | null} focusCommentId — Required when `variant === 'commentDetail'`.
 */
export default function LoungePostCommentThread({
  comments,
  /** Original feed post author id (`community_feed_posts.user_id`). */
  postAuthorUserId = '',
  postAgeLabel,
  variant = 'post',
  focusCommentId = null,
  loungeReadOnly = false,
  requireLoungeAuth = () => {},
  openProfileGateIfNeeded = () => false,
  onCommentReplyInteraction,
  onOpenCommentThread,
  onAvatarClickProfile,
}) {
  const byId = useMemo(() => new Map((comments || []).map((c) => [c.id, c])), [comments])

  const directReplyCountByCommentId = useMemo(() => {
    const m = new Map()
    for (const c of comments || []) {
      const pid = c.parent_id
      if (!pid) continue
      m.set(pid, (m.get(pid) || 0) + 1)
    }
    return m
  }, [comments])

  const rootsSorted = useMemo(() => {
    return [...(comments || [])]
      .filter((c) => !c.parent_id)
      .sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')))
  }, [comments])

  const focusComment = useMemo(() => {
    if (!focusCommentId) return null
    return byId.get(focusCommentId) || null
  }, [byId, focusCommentId])

  const directRepliesNewestFirst = useMemo(() => {
    if (!focusCommentId) return []
    return [...(comments || [])]
      .filter((c) => c.parent_id === focusCommentId)
      .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
  }, [comments, focusCommentId])

  if (variant === 'commentDetail') {
    if (!focusComment || !focusCommentId) {
      return (
        <p className="mt-1 text-[14px] text-zinc-500">Could not load this comment.</p>
      )
    }
    return (
      <>
        <LoungeCommentCard
          comment={focusComment}
          postAuthorUserId={postAuthorUserId}
          postAgeLabel={postAgeLabel}
          navigable={false}
          onOpenCommentThread={onOpenCommentThread}
          onAvatarClickProfile={onAvatarClickProfile}
          directReplyCount={directReplyCountByCommentId.get(focusComment.id) ?? 0}
          loungeReadOnly={loungeReadOnly}
          requireLoungeAuth={requireLoungeAuth}
          openProfileGateIfNeeded={openProfileGateIfNeeded}
          onCommentReplyInteraction={onCommentReplyInteraction}
        />
        {directRepliesNewestFirst.length ? (
          <ul className="mt-1.5 divide-y divide-zinc-800/70 space-y-0 border-t border-zinc-800/70 pt-1.5">
            {directRepliesNewestFirst.map((r) => (
              <li key={r.id}>
                <LoungeCommentCard
                  comment={r}
                  postAuthorUserId={postAuthorUserId}
                  postAgeLabel={postAgeLabel}
                  navigable={Boolean(onOpenCommentThread)}
                  onOpenCommentThread={onOpenCommentThread}
                  onAvatarClickProfile={onAvatarClickProfile}
                  directReplyCount={directReplyCountByCommentId.get(r.id) ?? 0}
                  loungeReadOnly={loungeReadOnly}
                  requireLoungeAuth={requireLoungeAuth}
                  openProfileGateIfNeeded={openProfileGateIfNeeded}
                  onCommentReplyInteraction={onCommentReplyInteraction}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 border-t border-zinc-800/70 pt-1.5 text-[14px] text-zinc-500">No replies yet.</p>
        )}
      </>
    )
  }

  if (rootsSorted.length === 0) {
    return <p className="mt-1 text-[14px] text-zinc-500">No comments yet. Be the first.</p>
  }

  return (
    <>
      <ul className="mt-0 divide-y divide-zinc-800/70 space-y-0">
        {rootsSorted.map((root) => (
          <li key={root.id}>
            <LoungeCommentCard
              comment={root}
              postAuthorUserId={postAuthorUserId}
              postAgeLabel={postAgeLabel}
              navigable={Boolean(onOpenCommentThread)}
              onOpenCommentThread={onOpenCommentThread}
              onAvatarClickProfile={onAvatarClickProfile}
              directReplyCount={directReplyCountByCommentId.get(root.id) ?? 0}
              loungeReadOnly={loungeReadOnly}
              requireLoungeAuth={requireLoungeAuth}
              openProfileGateIfNeeded={openProfileGateIfNeeded}
              onCommentReplyInteraction={onCommentReplyInteraction}
            />
          </li>
        ))}
      </ul>
    </>
  )
}
