// Geunnal Push Notification Service Worker v4

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = { title: '근날 알림', body: '모임 일정을 확인하세요.', url: '/', tag: 'geunnal' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch { /* ignore parse errors */ }

  const showOpts = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: data.tag || ('push-' + Date.now()),
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: data.url },
    requireInteraction: true,
    silent: false,
  }

  event.waitUntil(self.registration.showNotification(data.title, showOpts))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  const fullUrl = new URL(url, self.location.origin).href

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === fullUrl && 'focus' in client) return client.focus()
      }
      return clients.openWindow(fullUrl)
    })
  )
})
