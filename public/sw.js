// Geunnal Push Notification Service Worker v3

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  // 열려있는 페이지에 push 수신 사실 알리기
  const notifyClients = self.clients.matchAll({ type: 'window' }).then((cls) => {
    cls.forEach((c) => c.postMessage({ type: 'PUSH_RECEIVED', time: new Date().toISOString() }))
  })

  let data = { title: '근날 알림', body: '모임 일정을 확인하세요.', url: '/', tag: 'geunnal' }
  let parseError = null
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch (e) {
    parseError = String(e)
  }

  const showOpts = {
    body: parseError ? `[파싱오류] ${parseError.slice(0, 80)}` : data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: data.tag || ('push-' + Date.now()),
    vibrate: [200, 100, 200],
    data: { url: data.url },
    requireInteraction: false,
    silent: false,
  }

  event.waitUntil(
    Promise.all([
      notifyClients,
      self.registration.showNotification(data.title, showOpts),
    ])
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
