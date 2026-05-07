self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'LVSlotPro Reminder'
  const options = {
    body: payload.body || 'You have an upcoming event.',
    icon: payload.icon || '/android-chrome-192x192.png',
    badge: payload.badge || '/favicon-32x32.png',
    data: {
      url: payload.url || '/?tab=offers',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const relative = typeof event.notification?.data?.url === 'string' ? event.notification.data.url : '/?tab=offers'
  const fullUrl = new URL(relative, self.location.origin).href
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      for (const client of clients) {
        if (!('focus' in client)) continue
        try {
          await client.focus()
          if ('navigate' in client && typeof client.navigate === 'function') {
            await client.navigate(fullUrl).catch(() => {})
          }
          return
        } catch {
          continue
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(fullUrl)
      return undefined
    })
  )
})
