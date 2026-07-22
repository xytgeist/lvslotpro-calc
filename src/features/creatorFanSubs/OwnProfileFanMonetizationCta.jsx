import { useCallback, useEffect, useState } from 'react'
import ProfileFanSubPillButton from '../lounge/ProfileFanSubPillButton.jsx'
import {
  fetchMyCreatorFanMonetization,
  fetchMyCreatorFanSubscriberStats,
} from './creatorFanSubsApi.js'
import { isCreatorFanOfferComplete } from './fanSubOffer.js'

/**
 * Own-profile fan monetization entry — setup via Settings or Fan hub when live.
 *
 * @param {{
 *   supabaseClient: import('@supabase/supabase-js').SupabaseClient,
 *   onOpenFanSubscriptionSettings: () => void,
 *   onOpenCreatorFanPortal?: () => void,
 * }} props
 */
export default function OwnProfileFanMonetizationCta({
  supabaseClient,
  onOpenFanSubscriptionSettings,
  onOpenCreatorFanPortal,
}) {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [connectComplete, setConnectComplete] = useState(false)
  const [offerComplete, setOfferComplete] = useState(false)
  const [activeCount, setActiveCount] = useState(0)

  const reload = useCallback(async () => {
    if (!supabaseClient) {
      setLoading(false)
      return
    }
    try {
      const [row, stats] = await Promise.all([
        fetchMyCreatorFanMonetization(supabaseClient),
        fetchMyCreatorFanSubscriberStats(supabaseClient).catch(() => null),
      ])
      setEnabled(Boolean(row?.enabled))
      setConnectComplete(Boolean(row?.connect_onboarding_complete))
      setOfferComplete(row ? isCreatorFanOfferComplete(row) : false)
      setActiveCount(Number(stats?.active_count) || 0)
    } catch {
      setEnabled(false)
      setConnectComplete(false)
      setOfferComplete(false)
      setActiveCount(0)
    } finally {
      setLoading(false)
    }
  }, [supabaseClient])

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => {
    const onReturn = () => void reload()
    window.addEventListener('edge:creator-fan-billing-return', onReturn)
    document.addEventListener('visibilitychange', onReturn)
    return () => {
      window.removeEventListener('edge:creator-fan-billing-return', onReturn)
      document.removeEventListener('visibilitychange', onReturn)
    }
  }, [reload])

  if (loading) return null

  const live = enabled && connectComplete && offerComplete
  const hubLabel =
    activeCount > 0 ? `Fan hub · ${activeCount}` : live ? 'Fan hub' : 'Enable Subs'

  const onClick = () => {
    if (live && onOpenCreatorFanPortal) {
      onOpenCreatorFanPortal()
      return
    }
    onOpenFanSubscriptionSettings()
  }

  return (
    <ProfileFanSubPillButton
      capLabel="Enable Subs"
      pillLabel={live ? hubLabel : undefined}
      subscribed={false}
      postAlertsOn={live}
      onClick={onClick}
      title={
        live
          ? 'Open fan hub … subscribers, payouts, controls'
          : 'Set up fan subscriptions in Settings'
      }
      aria-label={live ? 'Open fan hub' : 'Enable fan subscriptions'}
    />
  )
}
