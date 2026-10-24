/**
 * DompetAri Service Worker
 * Handles caching for offline support using Cache-First strategy
 * for static assets and Network-First for HTML.
 */

const CACHE_NAME = 'dompetari-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/ui.js',
  './js/charts.js',
  './js/storage.js',
  './js/utils.js',
  './public/logo-tr.png',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// ─── Install: Pre-cache all static assets ─────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache local assets reliably; external CDN assets best-effort
      const localAssets = STATIC_ASSETS.filter(url => !url.startsWith('http'));
      const externalAssets = STATIC_ASSETS.filter(url => url.startsWith('http'));

      return Promise.all([
        cache.addAll(localAssets),
        ...externalAssets.map(url =>
          fetch(url, { mode: 'no-cors' })
            .then(res => cache.put(url, res))
            .catch(() => { /* external CDN failure is non-fatal */ })
        )
      ]);
    })
  );
  // Activate immediately without waiting for old SW to be released
  self.skipWaiting();
});

// ─── Activate: Clean up old caches ───────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  // Take control of all open clients immediately
  self.clients.claim();
});

// ─── Fetch: Cache-First for assets, Network-First for HTML ───────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and browser-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // Network-First for HTML navigation (ensures fresh content when online)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-First for everything else (CSS, JS, images, fonts)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // Only cache valid responses
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      });
    })
  );
});
