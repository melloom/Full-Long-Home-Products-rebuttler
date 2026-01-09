// Service Worker for CloseLoop PWA
const CACHE_NAME = 'closeloop-v1.0.4';
const STATIC_CACHE = 'closeloop-static-v1.0.4';
const DYNAMIC_CACHE = 'closeloop-dynamic-v1.0.4';

// Check if we're in development (localhost)
const isDevelopment = self.location.hostname === 'localhost' || 
                      self.location.hostname === '127.0.0.1' || 
                      self.location.hostname.includes('localhost');

// In development, immediately unregister and skip all events
if (isDevelopment) {
  self.addEventListener('install', (event) => {
    console.log('Service Worker: Development mode detected, unregistering...');
    event.waitUntil(
      self.registration.unregister().then(() => {
        console.log('Service Worker: Unregistered in development mode');
        return self.skipWaiting();
      })
    );
  });
  
  self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating in dev mode, unregistering...');
    event.waitUntil(
      self.registration.unregister().then(() => {
        console.log('Service Worker: Unregistered in development mode');
        return self.clients.claim();
      })
    );
  });
  
  // Skip all fetch events in development
  self.addEventListener('fetch', (event) => {
    // Don't intercept anything - let all requests pass through
    return;
  });
  
  // Exit early - don't register any other handlers
  // The rest of the code below will only run in production
} else {
  // Production code continues below...
  
  // Files to cache immediately
  const STATIC_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
  ];

  // Install event - cache static files
  self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
      caches.open(STATIC_CACHE)
        .then((cache) => {
          console.log('Service Worker: Caching static files');
          return cache.addAll(STATIC_FILES);
        })
        .then(() => {
          console.log('Service Worker: Static files cached');
          return self.skipWaiting();
        })
        .catch((error) => {
          console.error('Service Worker: Error caching static files:', error);
        })
    );
  });

  // Activate event - clean up old caches
  self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                console.log('Service Worker: Deleting old cache:', cacheName);
                return caches.delete(cacheName);
              }
            })
          );
        })
        .then(() => {
          console.log('Service Worker: Activated');
          return self.clients.claim();
        })
    );
  });

  // Fetch event - serve from cache, fallback to network
  self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // In development (localhost), skip ALL requests to let them pass through directly
  // This prevents service worker from interfering with Vite's dev server
  if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.includes('localhost')) {
    // Let all localhost requests pass through without ANY interception
    // Don't call event.respondWith() - just return to let the request go through normally
    return;
  }
  
  // Skip ALL Firestore and Firebase requests - let them pass through directly (including POST requests)
  // This is critical for Firestore real-time listeners and authentication
  if (url.hostname.includes('firestore.googleapis.com') ||
      url.hostname.includes('firebase.googleapis.com') ||
      url.hostname.includes('firebasestorage.googleapis.com') ||
      url.hostname.includes('firebaseapp.com') ||
      url.hostname.includes('identitytoolkit.googleapis.com') ||
      url.hostname.includes('securetoken.googleapis.com') ||
      url.hostname.includes('firebaseinstallations.googleapis.com') ||
      url.pathname.includes('/google.firestore.v1.Firestore/') ||
      url.pathname.includes('/v1/projects/') ||
      url.searchParams.has('database') && url.searchParams.get('database').includes('firestore')) {
    // Let Firestore/Firebase requests pass through without ANY interception
    // Don't call event.respondWith() - just return to let the request go through normally
    return;
  }
  
  // Skip ALL Vite dev server requests - let them pass through directly
  // This is critical for Vite's HMR and module loading in development
  if (url.pathname.includes('/node_modules/.vite/') ||
      url.pathname.includes('/.vite/deps/') ||
      url.pathname.includes('/@vite/') ||
      url.pathname.includes('/@fs/') ||
      url.searchParams.has('v') && url.searchParams.get('v').length > 10) {
    // Let Vite requests pass through without ANY interception
    // Don't call event.respondWith() - just return to let the request go through normally
    return;
  }
  
  // Skip non-GET requests (after checking Firebase)
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first, cache fallback
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(url.pathname)) {
    // Static assets - cache first, network fallback
    event.respondWith(handleStaticRequest(request));
  } else {
    // HTML pages - network first, cache fallback
    event.respondWith(handlePageRequest(request));
  }
  });

  // Handle API requests
  async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: API request failed, trying cache:', error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline response
    return new Response(
      JSON.stringify({ error: 'Offline - API not available' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  }

  // Handle static asset requests
  async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    // Fallback to network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Static asset not found:', error);
    
    // Return a default response for missing assets
    if (request.url.includes('.css')) {
      return new Response('/* Offline - CSS not available */', {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    
    if (request.url.includes('.js')) {
      return new Response('// Offline - JS not available', {
        headers: { 'Content-Type': 'application/javascript' }
      });
    }
    
    return new Response('Offline - Asset not available', { status: 404 });
  }
  }

  // Handle page requests
  async function handlePageRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Page request failed, trying cache:', error);
    
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/index.html');
  }
  }

  // Check if URL is a static asset
  function isStaticAsset(pathname) {
  const staticExtensions = [
    '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', 
    '.ico', '.woff', '.woff2', '.ttf', '.eot'
  ];
  
    return staticExtensions.some(ext => pathname.includes(ext));
  }

  // Handle background sync
  self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
  });

  // Background sync function
  async function doBackgroundSync() {
  try {
    console.log('Service Worker: Performing background sync');
    
    // Get all clients
    const clients = await self.clients.matchAll();
    
    // Notify all clients about the sync
    clients.forEach(client => {
      client.postMessage({
        type: 'BACKGROUND_SYNC',
        message: 'Background sync completed'
      });
    });
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
  }

  // Handle push notifications
  self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('CloseLoop', options)
  );
  });

  // Handle notification clicks
  self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
  });

  // Handle messages from the main thread
  self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  });

  // Handle errors
  self.addEventListener('error', (event) => {
    console.error('Service Worker: Error:', event.error);
  });

  self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker: Unhandled rejection:', event.reason);
  });
} 