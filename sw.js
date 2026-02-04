// Service Worker for HyperFiler Pro
// Version 1.0 - App Shell Caching Only

const CACHE_NAME = 'hyperfiler-v1.9.6-debug4';
const CACHE_VERSION = '20260204-debug4';

// App Shell - Critical files for offline functionality
const APP_SHELL = [
  '/hyperfiler-pro.html',
  '/manifest.json',
  '/js/tasks.js',
  '/js/ui.js',
  '/js/date-time-picker.js',
  '/js/list-ops.js',
  '/js/search-filter.js',
  '/js/task-bulk-ops.js',
  '/js/backup-import.js',
  '/js/settings-ui.js',
  '/js/auto-backup.js',
  '/js/missing-functions.js',
  '/js/sync.js',
  '/js/offline-sync.js',
  '/js/network-status.js',
  '/js/offline-ui.js',
  '/js/auth.js',
  '/js/natural-language.js',
  '/js/patches.js'
];

// Install event - Cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache app shell:', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - Cache-first strategy for app shell, network-first for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external URLs
  if (url.origin !== location.origin) {
    return;
  }

  // IMPORTANT: Skip service worker for problematic paths to avoid redirect issues
  if (url.pathname === '/' ||
      url.pathname === '/index.html' ||
      url.pathname === '/index-es.html' ||
      url.pathname === '/hyperfiler-pro' ||
      url.pathname === '/hyperfiler-pro.' ||
      url.pathname === '/hyperfiler-pro.html' ||
      url.pathname.endsWith('/')) {
    return;
  }

  // API requests - always go to network
  if (url.pathname.includes('/api/')) {
    return;
  }

  // App shell files - network first, fall back to cache (ensures fresh JS on reload)
  if (APP_SHELL.some(shellFile => url.pathname.endsWith(shellFile.replace('/', '')))) {
    event.respondWith(
      fetch(event.request, { redirect: 'follow' })
        .then((response) => {
          if (response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request, { ignoreSearch: true })
            .then((cachedResponse) => {
              if (cachedResponse) return cachedResponse;
              return new Response('Offline - Please check your connection', {
                status: 503,
                statusText: 'Service Unavailable'
              });
            });
        })
    );
  }
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      version: CACHE_VERSION,
      cache: CACHE_NAME
    });
  }
});
