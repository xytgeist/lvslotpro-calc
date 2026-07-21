import { useCallback, useEffect, useState } from 'react'
import ProfileFanSubPillButton from '../lounge/ProfileFanSubPillButton.jsx'
import { fetchMyCreatorFanMonetization } from './creatorFanSubsApi.js'
import { isCreatorFanOfferComplete } from './fanSubOffer.js'

/**
 * Own-profile fan monetization entry — same pill chrome as viewer SUB / alerts control.
 *
 * @param {{
 *   supabaseClient: import('@supabase/supabase-js').SupabaseClient,
 *   onOpenFanSubscriptionSettings: () => void,
 * }} props
 */
export default function OwnProfileFanMonetizationCta({
  supabaseClient,
  onOpenFanSubscriptionSettings,
}) {
  const [loading, setLoading] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [connectComplete, setConnectComplete] = useState(false)
  const [offerComplete, setOfferComplete] = useState(false)

  const reload = useCallback(async () => {
    if (!supabaseClient) {
      setLoading(false)
      return
    }
    try {
      const row = await fetchMyCreatorFanMonetization(supabaseClient)
      setEnabled(Boolean(row?.enabled))
      setConnectComplete(Boolean(row?.connect_onboarding_complete))
      setOfferComplete(row ? isCreatorFanOfferComplete(row) : false)
    } catch {
      setEnabled(false)
      setConnectComplete(false)
      setOfferComplete(false)
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

  return (
    <ProfileFanSubPillButton
      capLabel="Enable Subs"
      subscribed={live}
      onClick={onOpenFanSubscriptionSettings}
      title={
        live
          ? 'Fan subscriptions are live … manage in Settings'
          : 'Set up fan subscriptions in Settings'
      }
      aria-label={live ? 'Manage fan subscriptions' : 'Enable fan subscriptions'}
    />
  )
}
