const CACHE_PREFIX = 'barbara-life-'
const CACHE_NAME = 'barbara-life-shell-v4-private-vary-range-safe'
const BASE = '/barbara-life/'
const APP_SHELL = [
  BASE,
  `${BASE}offline.html`,
  `${BASE}manifest.webmanifest`,
  `${BASE}icon.svg`,
  `${BASE}icon-192.png`,
  `${BASE}icon-512.png`,
  `${BASE}icon-maskable-512.png`,
]
const SHELL_PATHS = new Set(APP_SHELL.map((entry) => new URL(entry, self.location.origin).pathname))
const SENSITIVE_QUERY = /(?:^|_)(?:token|access|refresh|session|password|secret|key|code)(?:$|_)/i

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)),
    )),
  )
  self.clients.claim()
})

function isSensitiveRequest(request, url) {
  if (request.headers.has('authorization') || request.headers.has('cookie')) return true
  if (request.headers.has('range') || request.headers.has('if-range')) return true
  if (url.hostname === 'aureonbase.vercel.app') return true
  if (/\/(?:api|auth|login|logout|session|account|profile|user|users|v1\/projects|api\/projects)(?:\/|$)/i.test(url.pathname)) return true
  for (const [key] of url.searchParams) if (SENSITIVE_QUERY.test(key)) return true
  return false
}

function isCacheableResponse(response) {
  if (!response || response.status !== 200 || response.type !== 'basic') return false
  const cacheControl = response.headers.get('cache-control') || ''
  const vary = response.headers.get('vary') || ''
  if (/no-store|private/i.test(cacheControl)) return false
  if (response.headers.has('set-cookie') || response.headers.has('content-range')) return false
  if (/authorization|cookie|range|if-range/i.test(vary)) return false
  return true
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (isSensitiveRequest(request, url)) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(`${BASE}offline.html`)))
    return
  }

  if (url.origin !== self.location.origin || !SHELL_PATHS.has(url.pathname) || url.search) return

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (!isCacheableResponse(response)) return response
      const copy = response.clone()
      event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)))
      return response
    })),
  )
})
