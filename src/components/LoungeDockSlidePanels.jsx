import { useLayoutEffect, useMemo, useState } from 'react'
import { feedPostDisplayCaption } from '../utils/communityFeedPost'
import { renderRichCaption } from '../features/lounge/loungeCaption'

/**
 * Left-sliding dock panels for Lounge (search / notifications / chat).
 * `bottomReservePx` clears the fixed dock footer height + a little gap.
 */
export default function LoungeDockSlidePanels({
  openPanel,
  onClose,
  communityPosts = [],
  bottomReservePx = 56,
  /** Optional: focus a post in the parent feed (e.g. open detail). */
  onPickPost,
}) {
  const [entered, setEntered] = useState(false)

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setEntered(true))
    })
    return () => window.cancelAnimationFrame(id)
  }, [openPanel])

  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return communityPosts
    return (communityPosts || []).filter((p) => {
      const cap = feedPostDisplayCaption(p).toLowerCase()
      const game = String(p?.game_title || '').toLowerCase()
      return cap.includes(s) || game.includes(s)
    })
  }, [communityPosts, q])

  if (!openPanel) return null

  const bottomPad = `max(0.75rem, calc(${bottomReservePx}px + env(safe-area-inset-bottom)))`

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className="fixed inset-0 z-[98] bg-black/45 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={openPanel === 'search' ? 'Search lounge' : openPanel === 'notifications' ? 'Notifications' : 'Chat'}
        className={`fixed left-0 top-0 z-[99] flex h-dvh max-h-dvh w-[min(22rem,calc(100vw-2.5rem))] max-w-[85vw] flex-col border-r border-zinc-800/90 bg-zinc-950 shadow-[8px_0_40px_rgba(0,0,0,0.45)] transition-transform duration-300 ease-out motion-reduce:transition-none ${
          entered ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ paddingBottom: bottomPad, paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-800/90 px-3 py-2">
          <h2 className="truncate text-[17px] font-semibold text-zinc-100">
            {openPanel === 'search' ? 'Search Lounge' : openPanel === 'notifications' ? 'Notifications' : 'Chat'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-zinc-700/60 bg-zinc-900 text-zinc-200 touch-manipulation hover:bg-zinc-800"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        {openPanel === 'search' ? (
          <div className="flex min-h-0 flex-1 flex-col px-3 pt-3">
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search captions & games…"
              autoComplete="off"
              className="mb-3 w-full rounded-xl border border-zinc-700 bg-zinc-900/90 px-3 py-2.5 text-[16px] text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-cyan-500/45 focus:ring-1 focus:ring-cyan-500/25"
            />
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] pb-2">
              {filtered.length === 0 ? (
                <p className="text-[14px] leading-relaxed text-zinc-500">No posts match.</p>
              ) : (
                <ul className="space-y-2">
                  {filtered.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        onClick={() => onPickPost?.(p.id)}
                        className="w-full rounded-xl border border-zinc-800/90 bg-zinc-900/60 px-3 py-2.5 text-left touch-manipulation hover:bg-zinc-800/70"
                      >
                        <div className="line-clamp-3 text-[14px] leading-snug text-zinc-200">
                          {renderRichCaption(feedPostDisplayCaption(p) || ' ', {
                            hashtagClassName: 'font-semibold text-cyan-400',
                          })}
                        </div>
                        {p.game_title ? (
                          <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-amber-400/85">{p.game_title}</div>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-4 [-webkit-overflow-scrolling:touch]">
            <p className="text-[15px] leading-relaxed text-zinc-400">
              {openPanel === 'notifications'
                ? 'Notification center is coming soon. Push and offer alerts continue to work from their tabs.'
                : 'Direct messages and group chat are on the roadmap — TLS + encrypted storage first, then richer chat.'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
