/** Navigate from a Lounge activity push / in-app toast payload (relative app URL). */
export function navigateFromLoungeActivityPayload(payload, { onTabHome } = {}) {
  if (typeof window === 'undefined') return { activityEventId: null, activityBatchId: null }

  const relative =
    typeof payload?.url === 'string' && payload.url.trim() ? payload.url.trim() : '/?tab=home'
  const parsed = new URL(relative, window.location.origin)
  const nextPath = `${parsed.pathname}${parsed.search}`
  if (window.location.pathname + window.location.search !== nextPath) {
    window.history.pushState({}, '', nextPath)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  onTabHome?.()

  const activityEventId =
    payload?.activityEventId || parsed.searchParams.get('activityEvent') || null
  const activityBatchId =
    payload?.activityBatchId || parsed.searchParams.get('activityBatch') || null

  return {
    activityEventId: activityEventId ? String(activityEventId) : null,
    activityBatchId: activityBatchId ? String(activityBatchId) : null,
  }
}

export function loungeActivityInAppPayloadFromMessage(data) {
  if (!data || data.type !== 'lounge-activity-inapp') return null
  return {
    title: data.title || 'Edge Lounge',
    body: data.body || '',
    url: data.url || '/?tab=home',
    activityEventId: data.activityEventId || null,
    activityBatchId: data.activityBatchId || null,
    icon: data.icon || '/android-icon-192x192.png',
  }
}
