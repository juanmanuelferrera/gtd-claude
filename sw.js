// Service Worker for HyperFiler Pro
// Version 1.0 - App Shell Caching Only

const CACHE_NAME = 'hyperfiler-v1.3.2-shell';
const CACHE_VERSION = '20250915-step5';

// App Shell - Critical files for offline functionality
const APP_SHELL = [
  '/hyperfiler-pro.html',
  '/manifest.json',
  '/js/tasks.js',
  '/js/ui.js', 
  '/js/missing-functions.js',
  '/js/sync.js',
  '/js/offline-sync.js',
  '/js/network-status.js',
  '/js/offline-ui.js',
  '/js/auth.js',
  '/js/natural-language.js',
  '/js/patches.js',
  '/extracted_js.js'
];

console.log('🔧 Service Worker loading - HyperFiler Pro v1.3.2');

// Install event - Cache app shell
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('💾 Service Worker: Caching app shell files');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('✅ Service Worker: App shell cached successfully');
        // Take control immediately
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Failed to cache app shell:', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activated successfully');
        // Take control of all tabs immediately
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
  
  // API requests - always go to network (preserve "server wins" logic)
  if (url.pathname.includes('/api/')) {
    console.log('🌐 Service Worker: API request - using network only:', url.pathname);
    return; // Let browser handle normally
  }
  
  // App shell files - cache first
  if (APP_SHELL.some(shellFile => url.pathname.endsWith(shellFile.replace('/', '')))) {
    console.log('💾 Service Worker: App shell request - cache first:', url.pathname);
    
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('✅ Service Worker: Serving from cache:', url.pathname);
            return cachedResponse;
          }
          
          console.log('🌐 Service Worker: Cache miss, fetching from network:', url.pathname);
          return fetch(event.request)
            .then((response) => {
              // Cache the response for future use
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseClone);
                  });
              }
              return response;
            })
            .catch((error) => {
              console.error('❌ Service Worker: Network fetch failed:', error);
              // Return a basic offline page if available
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
  console.log('📨 Service Worker: Received message:', event.data);
  
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

console.log('✅ Service Worker: Loaded successfully');