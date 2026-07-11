// Geunnal Push Notification Service Worker

self.addEventListener('push', (event) => {
  let data = { title: '근날 알림', body: '모임 일정을 확인하세요.', url: '/', tag: 'geunnal' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch { /* use defaults */ }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: data.tag || 'geunnal-default',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: data.url },
      actions: [
        { action: 'open', title: '확인하기' },
      ],
      requireInteraction: false,
      silent: false,
    })
  )
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
