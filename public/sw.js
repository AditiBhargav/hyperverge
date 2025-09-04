// KYC Lite Service Worker
const CACHE_NAME = 'kyc-lite-v2';
const STATIC_CACHE_NAME = 'kyc-lite-static-v2';
const DYNAMIC_CACHE_NAME = 'kyc-lite-dynamic-v2';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/debug',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Dashboard routes that should be cached
const DASHBOARD_ROUTES = [
  '/dashboard',
  '/dashboard/applications',
  '/dashboard/review'
];

// API endpoints that should use network-first strategy
const API_ENDPOINTS = [
  '/api/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(request)) {
    // Static assets: Cache first
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request)) {
    // API requests: Network first
    event.respondWith(networkFirst(request));
  } else if (isHTMLRequest(request)) {
    // HTML pages: Network first with offline fallback
    event.respondWith(networkFirstWithOffline(request));
  } else {
    // Everything else: Stale while revalidate
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Background sync for upload queue
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'upload-queue') {
    event.waitUntil(processUploadQueue());
  }
});

// Push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push message received');
  
  const options = {
    body: event.data ? event.data.text() : 'KYC verification update',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'kyc-notification',
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification('KYC Lite', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/_next/static/') ||
         url.pathname.includes('/icons/') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.woff') ||
         url.pathname.endsWith('.woff2');
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return API_ENDPOINTS.some(endpoint => url.pathname.startsWith(endpoint));
}

function isHTMLRequest(request) {
  const url = new URL(request.url);
  const isDashboardRoute = DASHBOARD_ROUTES.some(route => 
    url.pathname === route || url.pathname.startsWith(route + '/'));
  
  return request.headers.get('accept')?.includes('text/html') || isDashboardRoute;
}

// Cache strategies
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first failed:', error);
    return new Response('Offline - Asset not available', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(JSON.stringify({ 
      error: 'Network unavailable', 
      offline: true 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function networkFirstWithOffline(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for HTML, trying cache:', error);
    const url = new URL(request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For dashboard routes, try to serve the main dashboard page
    if (url.pathname.startsWith('/dashboard')) {
      const dashboardCache = await caches.match('/dashboard');
      if (dashboardCache) {
        return dashboardCache;
      }
    }
    
    // Return main app page as fallback
    return caches.match('/') || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const networkResponsePromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);
  
  return cachedResponse || await networkResponsePromise || 
         new Response('Offline', { status: 503 });
}

// Process upload queue in background
async function processUploadQueue() {
  try {
    console.log('Service Worker: Processing upload queue...');
    
    // This would integrate with your IndexedDB upload queue
    // For now, just log that background sync is working
    
    // In a real implementation, you would:
    // 1. Open IndexedDB
    // 2. Get pending uploads
    // 3. Attempt to upload each one
    // 4. Update status in database
    
    const message = {
      type: 'UPLOAD_QUEUE_PROCESSED',
      timestamp: new Date().toISOString()
    };
    
    // Notify all clients about background sync completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage(message);
    });
    
    console.log('Service Worker: Upload queue processed');
  } catch (error) {
    console.error('Service Worker: Error processing upload queue:', error);
  }
}
