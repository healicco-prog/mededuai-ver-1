// ─────────────────────────────────────────────────────────────
// MedEduAI Service Worker – PWA Offline + Cache Strategy
// ─────────────────────────────────────────────────────────────

const CACHE_NAME = 'mededuai-v2';

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  '/login',
  '/signup',
  '/logo.png',
  '/manifest.json',
];

// ── Install: Pre-cache static shell ─────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-cache failed for some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: Clean old caches ──────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ── Fetch: Network-first for API, Cache-first for static ───
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip API routes – always network
  if (url.pathname.startsWith('/api/')) return;

  // Skip auth callback routes
  if (url.pathname.startsWith('/auth/callback')) return;

  // For navigation requests (HTML pages): Network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            return cached || caches.match('/login');
          });
        })
    );
    return;
  }

  // For static assets: Cache first, then network
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff2?|ttf|eot|ico)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Default: Network first
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
