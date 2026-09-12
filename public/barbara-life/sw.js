const CACHE_NAME = 'barbara-life-shell-v2'
const BASE = '/barbara-life/'
const APP_SHELL = [BASE, `${BASE}index.html`, `${BASE}offline.html`, `${BASE}manifest.webmanifest`, `${BASE}icon.svg`]

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  const isPrivateOrApi =
    url.hostname === 'aureonbase.vercel.app' ||
    request.headers.has('authorization') ||
    url.pathname.includes('/auth/') ||
    url.pathname.includes('/v1/projects/') ||
    url.pathname.includes('/api/projects/')

  if (isPrivateOrApi) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(`${BASE}offline.html`)))
    return
  }

  if (url.origin !== self.location.origin) return

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (!response || response.status !== 200 || response.type !== 'basic') return response
      const copy = response.clone()
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
      return response
    }))
  )
})
