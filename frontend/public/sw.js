/**
 * Service Worker for Crash Game Frontend
 * Implements caching strategies for performance optimization
 * Requirement 3.1.3: Cache static assets for 1 year
 */

const CACHE_NAME = 'crash-game-v1';
const STATIC_CACHE_NAME = 'crash-game-static-v1';
const DYNAMIC_CACHE_NAME = 'crash-game-dynamic-v1';

// Assets to cache immediately (critical resources)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons.svg',
];

// Cache strategies for different resource types
const CACHE_STRATEGIES = {
  // Static assets - cache first with long expiration
  static: {
    patterns: [
      /\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|ico|webp)$/,
      /\/assets\//,
    ],
    strategy: 'CacheFirst',
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
  },
  
  // API calls - network first with fallback
  api: {
    patterns: [
      /\/api\//,
      /\/games\//,
      /\/wallets\//,
    ],
    strategy: 'NetworkFirst',
    maxAge: 5 * 60 * 1000, // 5 minutes
  },
  
  // HTML pages - network first with cache fallback
  pages: {
    patterns: [
      /\.html$/,
      /\/$/,
    ],
    strategy: 'NetworkFirst',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

/**
 * Install event - cache critical resources
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip WebSocket connections
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Determine cache strategy
  const strategy = getCacheStrategy(request);
  
  if (strategy) {
    event.respondWith(handleRequest(request, strategy));
  }
});

/**
 * Determine cache strategy for a request
 */
function getCacheStrategy(request) {
  const url = new URL(request.url);
  
  // Check static assets
  for (const pattern of CACHE_STRATEGIES.static.patterns) {
    if (pattern.test(url.pathname)) {
      return CACHE_STRATEGIES.static;
    }
  }
  
  // Check API calls
  for (const pattern of CACHE_STRATEGIES.api.patterns) {
    if (pattern.test(url.pathname)) {
      return CACHE_STRATEGIES.api;
    }
  }
  
  // Check pages
  for (const pattern of CACHE_STRATEGIES.pages.patterns) {
    if (pattern.test(url.pathname)) {
      return CACHE_STRATEGIES.pages;
    }
  }
  
  return null;
}

/**
 * Handle request based on cache strategy
 */
async function handleRequest(request, strategy) {
  const cacheName = strategy === CACHE_STRATEGIES.static ? STATIC_CACHE_NAME : DYNAMIC_CACHE_NAME;
  
  try {
    if (strategy.strategy === 'CacheFirst') {
      return await cacheFirst(request, cacheName, strategy.maxAge);
    } else if (strategy.strategy === 'NetworkFirst') {
      return await networkFirst(request, cacheName, strategy.maxAge);
    }
  } catch (error) {
    console.error('[SW] Request handling failed:', error);
    return fetch(request);
  }
}

/**
 * Cache First strategy - check cache first, fallback to network
 */
async function cacheFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cached response is still fresh
    const cachedDate = new Date(cachedResponse.headers.get('date') || 0);
    const now = new Date();
    
    if (now - cachedDate < maxAge) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }
  }
  
  // Fetch from network and cache
  try {
    console.log('[SW] Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone response before caching
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached response if network fails
    if (cachedResponse) {
      console.log('[SW] Network failed, serving stale cache:', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

/**
 * Network First strategy - try network first, fallback to cache
 */
async function networkFirst(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  
  try {
    console.log('[SW] Fetching from network:', request.url);
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone response before caching
      const responseToCache = networkResponse.clone();
      await cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('[SW] Network failed, serving from cache:', request.url);
      return cachedResponse;
    }
    
    throw error;
  }
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * Handle background sync
 */
async function doBackgroundSync() {
  // Implement offline action replay here
  // For example, retry failed API calls
  console.log('[SW] Performing background sync');
}

/**
 * Handle push notifications (future feature)
 */
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    console.log('[SW] Push notification received:', data);
    
    const options = {
      body: data.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey,
      },
      actions: [
        {
          action: 'explore',
          title: 'View Game',
          icon: '/icons.svg',
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons.svg',
        },
      ],
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

console.log('[SW] Service worker script loaded');