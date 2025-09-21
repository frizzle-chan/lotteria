// Lotería PWA Service Worker
// Version 1.0 - Offline-first strategy with comprehensive caching

const CACHE_NAME = 'loteria-v1.0';
const DATA_CACHE_NAME = 'loteria-data-v1.0';

// Static assets to cache immediately
const STATIC_CACHE_URLS = [
    './',
    './index.html',
    './script.js',
    './style.css',
    './manifest.json',
    // Fallback pages
    './offline.html'
];

// Runtime cache patterns
const RUNTIME_CACHE_PATTERNS = [
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
    /\.(?:js|css|html)$/,
    /^https:\/\/fonts\.googleapis\.com/,
    /^https:\/\/fonts\.gstatic\.com/
];

self.addEventListener('install', event => {
    console.log('[SW] Install event');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Pre-caching static assets');
                return cache.addAll(STATIC_CACHE_URLS);
            })
            .then(() => {
                // Force activation of new service worker
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[SW] Pre-cache failed:', error);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('[SW] Activate event');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Delete old caches
                    if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of all clients
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Handle different types of requests with appropriate strategies
    if (request.method === 'GET') {
        if (isStaticAsset(request)) {
            // Static assets: Cache First
            event.respondWith(cacheFirst(request));
        } else if (isImageRequest(request)) {
            // Images: Cache First with fallback
            event.respondWith(cacheFirstWithFallback(request));
        } else if (isDataRequest(request)) {
            // API/Data requests: Network First with cache fallback
            event.respondWith(networkFirst(request));
        } else {
            // Default: Network First
            event.respondWith(networkFirst(request));
        }
    }
});

// Cache strategies
async function cacheFirst(request) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('[SW] Cache hit:', request.url);
            return cachedResponse;
        }

        console.log('[SW] Cache miss, fetching:', request.url);
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Cache first failed:', error);
        return new Response('Offline content not available', { 
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

async function cacheFirstWithFallback(request) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }

        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.error('[SW] Cache first with fallback failed:', error);
        // Return placeholder image or offline fallback
        return createOfflineImageResponse();
    }
}

async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok && shouldCache(request)) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);
        
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline fallback for HTML requests
        if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./offline.html') || createOfflineResponse();
        }
        
        return createOfflineResponse();
    }
}

// Helper functions
function isStaticAsset(request) {
    const url = new URL(request.url);
    return STATIC_CACHE_URLS.some(asset => url.pathname.endsWith(asset.replace('./', ''))) ||
           url.pathname.includes('/static/') ||
           url.pathname.endsWith('.js') ||
           url.pathname.endsWith('.css') ||
           url.pathname.endsWith('.html');
}

function isImageRequest(request) {
    return RUNTIME_CACHE_PATTERNS[0].test(request.url) || 
           request.headers.get('accept')?.includes('image/');
}

function isDataRequest(request) {
    const url = new URL(request.url);
    return url.pathname.includes('/api/') || 
           request.headers.get('accept')?.includes('application/json');
}

function shouldCache(request) {
    const url = new URL(request.url);
    return url.origin === location.origin || 
           RUNTIME_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

function createOfflineResponse() {
    return new Response(
        JSON.stringify({
            error: 'Offline',
            message: 'This content is not available offline'
        }),
        {
            status: 503,
            statusText: 'Service Unavailable',
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
}

function createOfflineImageResponse() {
    // Return a simple SVG placeholder for offline images
    const svgPlaceholder = `
        <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
            <rect width="100%" height="100%" fill="#f8f9fa"/>
            <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#6c757d" font-family="Arial" font-size="14">
                Offline Image
            </text>
        </svg>
    `;
    
    return new Response(svgPlaceholder, {
        status: 200,
        statusText: 'OK',
        headers: {
            'Content-Type': 'image/svg+xml'
        }
    });
}

// Background sync for when connection returns (future enhancement)
self.addEventListener('sync', event => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'sync-user-data') {
        event.waitUntil(syncUserData());
    }
});

async function syncUserData() {
    // Future enhancement: sync local changes when connection returns
    console.log('[SW] Syncing user data...');
    try {
        // This would sync any pending changes to server
        // For now, just log that sync is available
        console.log('[SW] User data sync completed');
    } catch (error) {
        console.error('[SW] User data sync failed:', error);
    }
}

// Handle push notifications (future enhancement)
self.addEventListener('push', event => {
    console.log('[SW] Push event received');
    
    if (event.data) {
        const data = event.data.json();
        
        event.waitUntil(
            self.registration.showNotification(data.title, {
                body: data.body,
                icon: './manifest.json#icons[2].src',
                badge: './manifest.json#icons[0].src',
                tag: 'loteria-update',
                data: data
            })
        );
    }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    console.log('[SW] Notification clicked');
    
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('./')
    );
});

// Error handling
self.addEventListener('error', event => {
    console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
    console.error('[SW] Unhandled promise rejection:', event.reason);
});

console.log('[SW] Service Worker registered successfully');