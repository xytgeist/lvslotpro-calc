import { useCallback, useEffect, useState } from 'react'
import {
  fetchLoungeNotificationPreferences,
  isLoungeNotificationPrefsSchemaMissingError,
  LOUNGE_NOTIFICATION_PREF_DEFAULTS,
  upsertLoungeNotificationPreference,
} from '../../../utils/loungeNotificationPreferencesApi.js'

export default function useLoungeNotificationPreferences({ supabaseClient, viewerUserId }) {
  const [prefs, setPrefs] = useState(() => ({ ...LOUNGE_NOTIFICATION_PREF_DEFAULTS }))
  const [loading, setLoading] = useState(Boolean(viewerUserId))
  const [savingKey, setSavingKey] = useState('')
  const [schemaMissing, setSchemaMissing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!viewerUserId || !supabaseClient) {
      setPrefs({ ...LOUNGE_NOTIFICATION_PREF_DEFAULTS })
      setLoading(false)
      setSchemaMissing(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    setError('')
    ;(async () => {
      try {
        const next = await fetchLoungeNotificationPreferences(supabaseClient, viewerUserId)
        if (cancelled) return
        setPrefs(next)
        setSchemaMissing(false)
      } catch (e) {
        if (cancelled) return
        if (isLoungeNotificationPrefsSchemaMissingError(e)) {
          setSchemaMissing(true)
          setPrefs({ ...LOUNGE_NOTIFICATION_PREF_DEFAULTS })
        } else {
          setError(e?.message || 'Could not load notification preferences.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [supabaseClient, viewerUserId])

  const onPrefToggle = useCallback(
    async (key, nextEnabled) => {
      if (!viewerUserId || !supabaseClient || schemaMissing) return
      const prev = prefs
      setPrefs((cur) => ({ ...cur, [key]: nextEnabled }))
      setSavingKey(key)
      setError('')
      try {
        const next = await upsertLoungeNotificationPreference(supabaseClient, viewerUserId, {
          ...prev,
          [key]: nextEnabled,
        })
        setPrefs(next)
      } catch (e) {
        setPrefs(prev)
        setError(e?.message || 'Could not save preference.')
      } finally {
        setSavingKey('')
      }
    },
    [supabaseClient, viewerUserId, schemaMissing, prefs],
  )

  return {
    notificationPrefs: prefs,
    notificationPrefsLoading: loading,
    notificationPrefsSavingKey: savingKey,
    notificationPrefsSchemaMissing: schemaMissing,
    notificationPrefsError: error,
    onNotificationPrefToggle: onPrefToggle,
  }
}
