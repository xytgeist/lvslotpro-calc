import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Z_APP_ALERT } from '../../constants/appZIndex.js'
import { fetchPlayLogPartnerPickerData } from './playLogApi.js'
import { playLogPartnerLabel } from './playLogPartners.js'

const PANEL_HEIGHT_CLASS =
  'h-[min(88dvh,calc(100dvh-env(safe-area-inset-top,0px)-1rem))]'

/** @param {Array<{ user_id?: string, handle?: string, display_name?: string }>} rows @param {string} query */
function filterPartnerProfiles(rows, query) {
  const q = String(query || '')
    .trim()
    .toLowerCase()
    .replace(/^@/, '')
  if (!q) return rows
  return rows.filter(profile => {
    const name = String(profile?.display_name || '').toLowerCase()
    const handle = String(profile?.handle || '')
      .toLowerCase()
      .replace(/^@/, '')
    return name.includes(q) || handle.includes(q)
  })
}

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   supabaseClient: import('@supabase/supabase-js').SupabaseClient,
 *   userId: string,
 *   usedUserIds: Set<string>,
 *   onConfirmSelected: (profiles: object[]) => void,
 * }} props
 */
export default function PlayLogPartnerPickerModal({
  open,
  onClose,
  supabaseClient,
  userId,
  usedUserIds,
  onConfirmSelected,
}) {
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState(() => new Set())
  const [candidates, setCandidates] = useState([])
  const [viewerFollowingIds, setViewerFollowingIds] = useState(() => new Set())
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [followBusyId, setFollowBusyId] = useState('')
  const searchRef = useRef(null)

  const load = useCallback(async () => {
    if (!userId) {
      setCandidates([])
      setViewerFollowingIds(new Set())
      return
    }
    setLoading(true)
    setErr('')
    try {
      const data = await fetchPlayLogPartnerPickerData(supabaseClient, userId)
      if (data.error) {
        setErr(data.error)
        setCandidates([])
        setViewerFollowingIds(new Set())
        return
      }
      setCandidates(data.candidates)
      setViewerFollowingIds(data.viewerFollowingIds)
    } catch (e) {
      setCandidates([])
      setViewerFollowingIds(new Set())
      setErr(e?.message || 'Could not load partners.')
    } finally {
      setLoading(false)
    }
  }, [supabaseClient, userId])

  useEffect(() => {
    if (!open) {
      setSearch('')
      setSelectedIds(new Set())
      return
    }
    setSelectedIds(new Set())
    void load()
    const t = window.setTimeout(() => searchRef.current?.focus(), 120)
    return () => window.clearTimeout(t)
  }, [open, load])

  const selectedCount = selectedIds.size

  const toggleSelected = uid => {
    const id = String(uid || '').trim()
    if (!id || usedUserIds.has(id)) return
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const confirmSelected = () => {
    if (selectedCount === 0) return
    const picked = candidates.filter(p => selectedIds.has(String(p.user_id)))
    if (picked.length > 0) onConfirmSelected(picked)
    onClose()
  }

  const followUser = async targetUserId => {
    const target = String(targetUserId || '').trim()
    const viewer = String(userId || '').trim()
    if (!target || !viewer || target === viewer || followBusyId) return
    if (viewerFollowingIds.has(target)) return
    setFollowBusyId(target)
    try {
      const { error } = await supabaseClient.from('profile_follows').insert({
        follower_id: viewer,
        following_id: target,
      })
      if (error) throw error
      setViewerFollowingIds(prev => new Set(prev).add(target))
    } catch (e) {
      setErr(e?.message || 'Could not follow.')
    } finally {
      setFollowBusyId('')
    }
  }

  useEffect(() => {
    if (!open) return
    const onKey = e => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const filteredRows = useMemo(
    () => filterPartnerProfiles(candidates, search),
    [candidates, search],
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      style={{ zIndex: Z_APP_ALERT }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="play-log-partner-picker-title"
      onClick={onClose}
    >
      <div
        className={`flex w-full max-w-lg ${PANEL_HEIGHT_CLASS} shrink-0 flex-col rounded-t-3xl border border-zinc-700/60 border-b-0 bg-zinc-900 shadow-2xl`}
        onClick={e => e.stopPropagation()}
      >
        <header className="shrink-0 border-b border-zinc-800/80 px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <h2
              id="play-log-partner-picker-title"
              className="min-w-0 flex-1 text-base font-bold text-white"
            >
              Add partner
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-zinc-400 touch-manipulation active:bg-zinc-800 active:text-white"
            >
              Cancel
            </button>
          </div>
          <label className="sr-only" htmlFor="play-log-partner-search">
            Search followers and following
          </label>
          <input
            id="play-log-partner-search"
            ref={searchRef}
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or @handle"
            autoComplete="off"
            enterKeyHint="search"
            className="w-full min-h-11 rounded-xl bg-zinc-950 border border-zinc-700/60 px-3 text-sm text-white outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-2 pb-2">
          {loading ? (
            <div className="flex h-full min-h-[12rem] items-center justify-center">
              <p className="text-zinc-500 text-sm text-center">Loading…</p>
            </div>
          ) : err && candidates.length === 0 ? (
            <div className="flex h-full min-h-[12rem] items-center justify-center px-2">
              <p className="text-red-400 text-sm text-center">{err}</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex h-full min-h-[12rem] items-center justify-center px-2">
              <p className="text-zinc-500 text-sm text-center">
                {search.trim() ? 'No matches.' : 'No followers or following yet.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800/70">
              {filteredRows.map(profile => {
                const uid = String(profile.user_id)
                const alreadyAdded = usedUserIds.has(uid)
                const checked = !alreadyAdded && selectedIds.has(uid)
                const followingThem = viewerFollowingIds.has(uid)
                const showFollow = !followingThem
                return (
                  <li key={uid}>
                    <div
                      className={`flex items-start gap-2 rounded-xl px-2 py-3 ${
                        alreadyAdded ? 'opacity-40' : ''
                      }`}
                    >
                      <label
                        className={`flex min-w-0 flex-1 items-start gap-3 touch-manipulation ${
                          alreadyAdded ? 'cursor-not-allowed' : 'cursor-pointer active:bg-zinc-800/80'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={alreadyAdded}
                          onChange={() => toggleSelected(uid)}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-950 accent-cyan-500 disabled:opacity-50"
                          aria-label={`Select ${playLogPartnerLabel(profile)}`}
                        />
                        <span className="min-w-0 flex-1 text-sm">
                          <span className="text-zinc-100 font-medium">{playLogPartnerLabel(profile)}</span>
                          {profile.handle ? (
                            <span className="block text-zinc-500 text-xs mt-0.5">
                              @{String(profile.handle).trim().replace(/^@/, '')}
                            </span>
                          ) : null}
                          {alreadyAdded ? (
                            <span className="block text-zinc-500 text-xs mt-0.5">Already added</span>
                          ) : showFollow ? (
                            <span className="block text-zinc-500 text-xs mt-0.5">Follows you</span>
                          ) : null}
                        </span>
                      </label>
                      {showFollow ? (
                        <button
                          type="button"
                          disabled={followBusyId === uid}
                          onClick={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            void followUser(uid)
                          }}
                          className="mt-0.5 shrink-0 min-h-9 rounded-full bg-white px-4 text-[13px] font-bold text-zinc-950 touch-manipulation active:bg-zinc-200 disabled:opacity-50"
                        >
                          {followBusyId === uid ? '…' : 'Follow'}
                        </button>
                      ) : (
                        <div className="w-[4.75rem] shrink-0" aria-hidden />
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {err && candidates.length > 0 ? (
          <p className="shrink-0 px-4 pb-1 text-center text-xs text-red-400">{err}</p>
        ) : null}

        <footer className="shrink-0 border-t border-zinc-800/80 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <button
            type="button"
            onClick={confirmSelected}
            disabled={selectedCount === 0 || loading}
            className="w-full min-h-12 rounded-2xl bg-cyan-600 text-white font-bold touch-manipulation active:bg-cyan-700 disabled:opacity-40"
          >
            {selectedCount === 0
              ? 'Add selected'
              : selectedCount === 1
                ? 'Add 1 partner'
                : `Add ${selectedCount} partners`}
          </button>
        </footer>
      </div>
    </div>
  )
}
