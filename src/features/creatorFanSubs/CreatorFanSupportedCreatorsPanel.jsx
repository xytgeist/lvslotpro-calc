import { useCallback, useEffect, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { LOUNGE_NOTIFICATION_AUTHOR_AVATAR_CLASS } from '../lounge/loungeFeedAvatar.js'
import {
  profileAvatarInitials,
  profileAvatarToneClass,
} from '../profiles/profileGate.js'
import {
  fetchCreatorProfilesForFanSubs,
  fetchMyCreatorFanSubscriptions,
} from './creatorFanSubsApi.js'
import { fanSubBillingStatusLine } from './fanSubBillingDates.js'
import { formatFanTierLabel } from './fanSubTiers.js'

/**
 * @param {{
 *   supabaseClient: import('@supabase/supabase-js').SupabaseClient,
 *   onOpenCreatorProfile?: (entity: { user_id: string, author_profile?: object }) => void,
 * }} props
 */
export default function CreatorFanSupportedCreatorsPanel({ supabaseClient, onOpenCreatorProfile }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  /** @type {[Array<{ sub: Awaited<ReturnType<typeof fetchMyCreatorFanSubscriptions>>[number], profile?: { user_id?: string, handle?: string, display_name?: string, avatar_url?: string } }>, import('react').Dispatch<import('react').SetStateAction<Array<{ sub: Awaited<ReturnType<typeof fetchMyCreatorFanSubscriptions>>[number], profile?: { user_id?: string, handle?: string, display_name?: string, avatar_url?: string } }>>>]} */
  const [rows, setRows] = useState([])

  const reload = useCallback(async () => {
    if (!supabaseClient) {
      setLoading(false)
      setRows([])
      return
    }
    setError('')
    try {
      const subs = await fetchMyCreatorFanSubscriptions(supabaseClient)
      const profileById = await fetchCreatorProfilesForFanSubs(
        supabaseClient,
        subs.map((s) => s.creatorUserId),
      )
      setRows(
        subs.map((sub) => ({
          sub,
          profile: profileById[sub.creatorUserId],
        })),
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load creators you support.')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [supabaseClient])

  useEffect(() => {
    setLoading(true)
    void reload()
  }, [reload])

  useEffect(() => {
    if (!supabaseClient) return undefined
    const onFanBillingReturn = () => {
      void reload()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') void reload()
    }
    window.addEventListener('edge:creator-fan-billing-return', onFanBillingReturn)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('edge:creator-fan-billing-return', onFanBillingReturn)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [reload, supabaseClient])

  const openCreatorProfile = (sub, profile) => {
    if (typeof onOpenCreatorProfile !== 'function') return
    onOpenCreatorProfile({
      user_id: sub.creatorUserId,
      author_profile: {
        user_id: sub.creatorUserId,
        handle: profile?.handle,
        display_name: profile?.display_name,
        avatar_url: profile?.avatar_url,
      },
    })
  }

  return (
    <div className="px-3.5 py-3" data-settings-creators-i-support>
      <div className="text-[15px] font-semibold text-zinc-100">Creators I support</div>
      <p className="mt-1 text-[12px] leading-snug text-zinc-500">
        Fan subscriptions you pay for each month. Tap a creator to open their profile.
      </p>

      {loading ? (
        <p className="mt-3 text-[13px] text-zinc-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-3 text-[13px] leading-relaxed text-zinc-500">
          You are not subscribed to any creators yet. Subscribe from a creator&apos;s profile in the Lounge.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {rows.map(({ sub, profile }) => {
            const handle = String(profile?.handle || '').trim()
            const handleAt = handle ? `@${handle.replace(/^@/, '')}` : '@creator'
            const displayName =
              String(profile?.display_name || handle || 'Creator').trim() || 'Creator'
            const tierLabel = formatFanTierLabel(sub.fanTierKey)
            const statusLine = fanSubBillingStatusLine({
              cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
              currentPeriodEnd: sub.currentPeriodEnd,
            })
            const avatarUrl = profile?.avatar_url ? String(profile.avatar_url) : ''
            const seed = sub.creatorUserId
            const canOpen = typeof onOpenCreatorProfile === 'function'

            return (
              <li key={sub.creatorUserId}>
                <button
                  type="button"
                  disabled={!canOpen}
                  onClick={() => openCreatorProfile(sub, profile)}
                  className="flex w-full gap-3 rounded-xl border border-zinc-800/90 bg-zinc-900/35 p-3 text-left touch-manipulation hover:bg-zinc-800/45 disabled:cursor-default disabled:hover:bg-zinc-900/35 [-webkit-tap-highlight-color:transparent]"
                  aria-label={`Open ${displayName}'s profile`}
                >
                  <div
                    className={`${LOUNGE_NOTIFICATION_AUTHOR_AVATAR_CLASS} shrink-0 overflow-hidden ${profileAvatarToneClass(seed)}`}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-bold text-white">
                        {profileAvatarInitials(displayName, handle)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-zinc-100">{displayName}</p>
                    <p className="truncate text-[13px] text-zinc-400">{handleAt}</p>
                    <p className="mt-1 text-[12px] font-semibold text-orange-400/95">{tierLabel}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-zinc-500">{statusLine}</p>
                  </div>
                  {canOpen ? (
                    <ChevronRight
                      className="mt-1 h-5 w-5 shrink-0 text-zinc-600"
                      strokeWidth={2}
                      aria-hidden
                    />
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {error ? <p className="mt-3 text-[12px] leading-snug text-red-300/90">{error}</p> : null}
    </div>
  )
}
