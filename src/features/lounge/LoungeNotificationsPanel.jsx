import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import LoungeOgBadge from './LoungeOgBadge.jsx'
import {
  LOUNGE_FEED_AVATAR_CLASS,
  LOUNGE_FEED_META_ROW_CLASS,
} from './loungeFeedAvatar.js'
import {
  profileAvatarInitials,
  profileAvatarToneClass,
} from '../profiles/profileGate.js'
import {
  formatLoungeActivityWhen,
  isLoungeActivitySchemaMissingError,
  loungeActivityEventsPage,
  loungeActivityMarkAllRead,
  loungeActivitySummary,
  LOUNGE_ACTIVITY_EVENT_TYPES,
  LOUNGE_ACTIVITY_PAGE_SIZE,
} from '../../utils/loungeActivityApi.js'

/**
 * Lounge dock **Notifications** panel — in-app activity feed (Phase H1).
 */
export default function LoungeNotificationsPanel({
  supabaseClient,
  viewerUserId,
  onOpenPost,
  onOpenProfile,
  onUnreadChange,
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [err, setErr] = useState('')
  const [schemaMissing, setSchemaMissing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const markedReadRef = useRef(false)
  /** Unread at fetch time — stays "new" for this panel visit even after mark-all-read clears the badge. */
  const [sessionNewIds, setSessionNewIds] = useState(() => new Set())

  const loadPage = useCallback(
    async ({ append = false, cursor = null } = {}) => {
      if (!viewerUserId || !supabaseClient) {
        setItems([])
        setLoading(false)
        setHasMore(false)
        return
      }
      if (append) setLoadingMore(true)
      else setLoading(true)
      setErr('')
      try {
        const rows = await loungeActivityEventsPage(supabaseClient, {
          limit: LOUNGE_ACTIVITY_PAGE_SIZE,
          beforeCreatedAt: cursor?.created_at ?? null,
          beforeId: cursor?.id ?? null,
        })
        setSchemaMissing(false)
        setHasMore(rows.length >= LOUNGE_ACTIVITY_PAGE_SIZE)
        setItems((prev) => (append ? [...prev, ...rows] : rows))
        if (append) {
          if (rows.some((row) => !row.read_at)) {
            setSessionNewIds((prev) => {
              const next = new Set(prev)
              for (const row of rows) {
                if (!row.read_at) next.add(row.id)
              }
              return next
            })
          }
        } else {
          const newIds = new Set()
          for (const row of rows) {
            if (!row.read_at) newIds.add(row.id)
          }
          setSessionNewIds(newIds)
        }
      } catch (e) {
        if (isLoungeActivitySchemaMissingError(e)) {
          setSchemaMissing(true)
          setItems([])
          setHasMore(false)
        } else {
          setErr(e?.message || 'Could not load notifications.')
          if (!append) setItems([])
        }
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [supabaseClient, viewerUserId],
  )

  useEffect(() => {
    markedReadRef.current = false
    void loadPage()
  }, [loadPage])

  useEffect(() => {
    if (!viewerUserId || !supabaseClient || schemaMissing || markedReadRef.current) return
    if (loading) return
    markedReadRef.current = true
    void (async () => {
      try {
        await loungeActivityMarkAllRead(supabaseClient)
        onUnreadChange?.(0)
      } catch {
        markedReadRef.current = false
      }
    })()
  }, [loading, onUnreadChange, schemaMissing, supabaseClient, viewerUserId])

  const onLoadMore = useCallback(() => {
    if (loadingMore || !hasMore || items.length === 0) return
    const last = items[items.length - 1]
    void loadPage({ append: true, cursor: { created_at: last.created_at, id: last.id } })
  }, [hasMore, items, loadPage, loadingMore])

  const sessionNewCount = sessionNewIds.size

  const emptyCopy = useMemo(() => {
    if (schemaMissing) {
      return 'Notification center is almost ready — apply the Phase H SQL migration on test, then refresh.'
    }
    return 'No notifications yet. When someone follows you, comments, replies, or @mentions you, it shows up here.'
  }, [schemaMissing])

  const onRowActivate = useCallback(
    (event) => {
      if (!event) return
      if (event.event_type === LOUNGE_ACTIVITY_EVENT_TYPES.FOLLOW) {
        onOpenProfile?.({
          user_id: event.actor_user_id,
          author_profile: {
            user_id: event.actor_user_id,
            handle: event.actor_handle,
            display_name: event.actor_display_name,
            avatar_url: event.actor_avatar_url,
            role: event.actor_role,
            is_og: event.actor_is_og,
          },
        })
        return
      }
      if (event.post_id) {
        onOpenPost?.({
          postId: event.post_id,
          commentId: event.comment_id || null,
        })
      }
    },
    [onOpenPost, onOpenProfile],
  )

  if (!viewerUserId) {
    return (
      <div className="px-3 py-4">
        <p className="text-[15px] leading-relaxed text-zinc-400">Sign in to see your notifications.</p>
      </div>
    )
  }

  return (
    <div className="px-3 py-3">
      <h2 className="text-[17px] font-semibold text-zinc-100">Notifications</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-zinc-500">
        {sessionNewCount > 0
          ? `${sessionNewCount} new · Replies, comments on your posts, @mentions, and new followers.`
          : 'Replies, comments on your posts, @mentions, and new followers.'}
      </p>

      {loading ? (
        <p className="mt-6 text-[14px] text-zinc-500">Loading…</p>
      ) : err ? (
        <p className="mt-6 text-[14px] text-red-300">{err}</p>
      ) : items.length === 0 ? (
        <p className="mt-6 text-[14px] leading-relaxed text-zinc-400">{emptyCopy}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-1">
          {items.map((event) => {
            const isNew = sessionNewIds.has(event.id)
            const actorProfile = {
              user_id: event.actor_user_id,
              handle: event.actor_handle,
              display_name: event.actor_display_name,
              avatar_url: event.actor_avatar_url,
              role: event.actor_role,
              is_og: event.actor_is_og,
            }
            const avatarTone = profileAvatarToneClass(actorProfile)
            const avatarText = profileAvatarInitials(actorProfile)
            const when = formatLoungeActivityWhen(event.created_at)
            const summary = loungeActivitySummary(event)

            return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onRowActivate(event)}
                  aria-label={isNew ? `${summary} — new notification` : `${summary} — seen`}
                  className={`relative flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left touch-manipulation [-webkit-tap-highlight-color:transparent] ${
                    isNew
                      ? 'border-cyan-500/40 bg-cyan-950/25 hover:bg-cyan-950/35'
                      : 'border-zinc-800/70 bg-zinc-950/30 hover:bg-zinc-900/55'
                  }`}
                >
                  {isNew ? (
                    <span
                      className="absolute left-0 top-3 bottom-3 w-[3px] rounded-full bg-cyan-400"
                      aria-hidden
                    />
                  ) : null}
                  <span
                    className={`${LOUNGE_FEED_AVATAR_CLASS} ${avatarTone} shrink-0 ${isNew ? '' : 'opacity-80'}`}
                    aria-hidden
                  >
                    {avatarText}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`${LOUNGE_FEED_META_ROW_CLASS} flex-wrap gap-x-1.5 gap-y-0.5`}>
                      <span
                        className={`text-[15px] ${isNew ? 'font-semibold text-zinc-50' : 'font-medium text-zinc-400'}`}
                      >
                        {summary}
                      </span>
                      {event.actor_is_og ? <LoungeOgBadge /> : null}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      {when ? <span className="text-[13px] text-zinc-500">{when}</span> : null}
                      {isNew ? (
                        <span className="rounded-full bg-cyan-500/15 px-1.5 py-px text-[11px] font-semibold uppercase tracking-wide text-cyan-300">
                          New
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium uppercase tracking-wide text-zinc-600">Seen</span>
                      )}
                    </span>
                  </span>
                  {isNew ? (
                    <span
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.55)]"
                      aria-hidden
                    />
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {hasMore && !loading && items.length > 0 ? (
        <div className="py-4">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="mx-auto flex min-h-10 items-center justify-center rounded-xl border border-zinc-700/90 bg-zinc-900/70 px-5 text-[14px] font-medium text-zinc-200 touch-manipulation hover:border-zinc-600 hover:bg-zinc-800/80 disabled:opacity-60 [-webkit-tap-highlight-color:transparent]"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
