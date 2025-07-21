// Service Worker for EtchNFT - Production-ready caching and offline support

const CACHE_NAME = 'etchnft-v1';
const STATIC_CACHE = 'etchnft-static-v1';
const DYNAMIC_CACHE = 'etchnft-dynamic-v1';

// Static assets to cache
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  // Add critical CSS and JS files here
];

// API endpoints to cache
const CACHE_API_PATTERNS = [
  /^\/api\/nfts\//,
  /^\/api\/user\//,
];

// Don't cache these patterns
const NO_CACHE_PATTERNS = [
  /^\/api\/auth\//,
  /^\/api\/webhooks\//,
  /^\/api\/analytics\//,
  /^\/api\/errors\//,
];

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE)
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Skip requests to external domains (except for specific resources)
  if (url.origin !== location.origin && !shouldCacheExternal(url)) {
    return;
  }
  
  // Skip no-cache patterns
  if (NO_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Handle static assets
    if (isStaticAsset(url)) {
      return handleStaticAsset(request);
    }
    
    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request);
    }
    
    // Handle page requests
    return handlePageRequest(request);
    
  } catch (error) {
    console.error('Service Worker error:', error);
    return fetch(request);
  }
}

async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached version immediately
    fetch(request)
      .then(response => {
        if (response.ok) {
          cache.put(request, response.clone());
        }
      })
      .catch(console.error);
    
    return cachedResponse;
  }
  
  // Not in cache, fetch and cache
  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  
  return response;
}

async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Check if this API should be cached
  const shouldCache = CACHE_API_PATTERNS.some(pattern => pattern.test(url.pathname));
  
  if (!shouldCache) {
    return fetch(request);
  }
  
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Try network first
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

async function handlePageRequest(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    // Try network first
    const response = await fetch(request);
    
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await cache.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Last resort: basic offline message
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>EtchNFT - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh; 
              margin: 0; 
              background: linear-gradient(135deg, #000, #333);
              color: white;
              text-align: center;
            }
            .container { max-width: 400px; padding: 2rem; }
            .emoji { font-size: 4rem; margin-bottom: 1rem; }
            h1 { margin-bottom: 1rem; }
            p { opacity: 0.8; margin-bottom: 2rem; }
            button { 
              background: #00ff88; 
              color: black; 
              border: none; 
              padding: 1rem 2rem; 
              border-radius: 2rem; 
              font-weight: bold; 
              cursor: pointer; 
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="emoji">📱</div>
            <h1>You're Offline</h1>
            <p>Check your internet connection and try again.</p>
            <button onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.woff', '.woff2'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

function shouldCacheExternal(url) {
  const allowedDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'kit.fontawesome.com',
  ];
  
  return allowedDomains.some(domain => url.hostname.includes(domain));
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Retry failed API requests when connection is restored
  console.log('Background sync triggered');
  
  // You can implement retry logic here for failed requests
  // For example, retry failed analytics or error reports
}