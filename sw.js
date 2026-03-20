// Service Worker for Shikola Pro - Background Sync and Offline Support
const CACHE_NAME = 'shikola-pro-v1';
const STATIC_CACHE = 'shikola-static-v1';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/frontend/index.html',
    '/shared-assets/css/styles.css',
    '/shared-assets/js/shared-api-client.js',
    '/shared-assets/js/shared-auth.js',
    '/shared-assets/js/shared-messages.js',
    '/shared-assets/js/dashboard-theme.js',
    '/shared-assets/js/button-functions.js',
    '/shared-assets/js/portal-auth-guard.js',
    '/shared-assets/js/enhanced-realtime-system.js',
    '/frontend/public/images/favicon.png'
];

// API endpoints that can be cached
const CACHEABLE_ENDPOINTS = [
    '/api/fees',
    '/api/expenses',
    '/api/users',
    '/api/courses',
    '/api/grades',
    '/api/attendance',
    '/api/notifications',
    '/api/announcements'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE).then(cache => {
            return cache.addAll(STATIC_FILES);
        }).then(() => {
            self.skipWaiting();
            return self.clients.claim();
        })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Handle different request types
    if (request.method === 'GET') {
        // Handle static file requests
        if (STATIC_FILES.some(file => url.pathname.includes(file))) {
            event.respondWith(handleStaticRequest(request));
            return;
        }
        
        // Handle API requests
        if (CACHEABLE_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))) {
            event.respondWith(handleAPIRequest(request));
            return;
        }
    }
    
    // Handle POST requests for real-time updates
    if (request.method === 'POST' && url.pathname.includes('/api/realtime')) {
        event.respondWith(handleRealtimeRequest(request));
        return;
    }
    
    // Let other requests pass through to network
    event.respondWith(fetch(request));
});

// Handle static file requests
async function handleStaticRequest(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Fetch from network and cache
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            const cache = await caches.open(STATIC_CACHE);
            cache.put(request, responseClone);
            return networkResponse;
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Error handling static request:', error);
        return new Response('Offline', { status: 503 });
    }
}

// Handle API requests with caching
async function handleAPIRequest(request) {
    try {
        const cachedResponse = await caches.match(request);
        if (cachedResponse && !navigator.onLine) {
            // Return cached response when offline
            return cachedResponse;
        }
        
        // Try network first
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            
            // Cache successful responses
            if (navigator.onLine) {
                const cache = await caches.open(CACHE_NAME);
                cache.put(request, responseClone);
            }
            
            return networkResponse;
        }
        
        // Return cached response if network fails
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return networkResponse;
    } catch (error) {
        console.error('Error handling API request:', error);
        
        // Try to return cached response as fallback
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        return new Response('Network Error', { status: 503 });
    }
}

// Handle real-time requests
async function handleRealtimeRequest(request) {
    try {
        const data = await request.json();
        console.log('Service Worker handling real-time request:', data);
        
        // Broadcast to all clients
        const clients = await self.clients.matchAll();
        const message = {
            type: 'realtime_broadcast',
            data: data,
            timestamp: Date.now()
        };
        
        clients.forEach(client => {
            if (client.readyState === 'activated') {
                client.postMessage(message);
            }
        });
        
        return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error handling real-time request:', error);
        return new Response('Error', { status: 500 });
    }
}

// Listen for messages from clients
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'CACHE_API_DATA':
            cacheAPIData(data);
            break;
        case 'CLEAR_CACHE':
            clearCache();
            break;
        case 'SYNC_DATA':
            syncDataWithServer(data);
            break;
        case 'GET_CACHED_DATA':
            getCachedDataForClient(data, event.ports[0]);
            break;
        default:
            console.log('Unknown message type:', type);
    }
});

// Cache API data
async function cacheAPIData(data) {
    try {
        const { endpoint, responseData } = data;
        const cache = await caches.open(CACHE_NAME);
        const request = new Request(endpoint, { method: 'GET' });
        const response = new Response(JSON.stringify(responseData), {
            headers: { 'Content-Type': 'application/json' }
        });
        await cache.put(request, response);
        console.log('Cached API data for:', endpoint);
    } catch (error) {
        console.error('Error caching API data:', error);
    }
}

// Clear cache
async function clearCache() {
    try {
        await caches.delete(CACHE_NAME);
        console.log('Cache cleared');
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
}

// Sync data with server
async function syncDataWithServer(data) {
    try {
        const { endpoint, method = 'POST', payload } = data;
        
        const response = await fetch(endpoint, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await getAuthToken()}`
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            console.log('Data synced with server:', endpoint);
        }
    } catch (error) {
        console.error('Error syncing data with server:', error);
    }
}

// Get cached data for client
async function getCachedDataForClient(data, port) {
    try {
        const { endpoint } = data;
        const cache = await caches.open(CACHE_NAME);
        const request = new Request(endpoint, { method: 'GET' });
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            const responseData = await cachedResponse.json();
            port.postMessage({ 
                type: 'CACHED_DATA_RESPONSE', 
                endpoint, 
                data: responseData 
            });
        } else {
            port.postMessage({ 
                type: 'CACHED_DATA_RESPONSE', 
                endpoint, 
                data: null 
            });
        }
    } catch (error) {
        console.error('Error getting cached data:', error);
        port.postMessage({ 
            type: 'CACHED_DATA_RESPONSE', 
            endpoint, 
            data: null 
        });
    }
}

// Get auth token (this would need to be implemented based on your auth system)
async function getAuthToken() {
    // This is a placeholder - implement based on your actual auth token storage
    return localStorage.getItem('authToken') || 'Bearer token';
}

// Background sync for real-time updates
self.addEventListener('sync', (event) => {
    console.log('Background sync triggered:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            syncAllData().then(() => {
                console.log('Background sync completed');
            })
        );
    }
});

// Sync all data in background
async function syncAllData() {
    const endpoints = [
        '/api/fees',
        '/api/expenses',
        '/api/users',
        '/api/courses',
        '/api/grades',
        '/api/attendance',
        '/api/notifications',
        '/api/announcements'
    ];
    
    const syncPromises = endpoints.map(async (endpoint) => {
        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${await getAuthToken()}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const cache = await caches.open(CACHE_NAME);
                const request = new Request(endpoint, { method: 'GET' });
                const cacheResponse = new Response(JSON.stringify(data), {
                    headers: { 'Content-Type': 'application/json' }
                });
                await cache.put(request, cacheResponse);
                console.log('Synced data for:', endpoint);
            }
        } catch (error) {
            console.error(`Error syncing ${endpoint}:`, error);
        }
    });
    
    return Promise.allSettled(syncPromises);
}

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
    console.log('Periodic sync triggered:', event.tag);
    
    if (event.tag === 'periodic-sync') {
        event.waitUntil(
            syncAllData().then(() => {
                console.log('Periodic sync completed');
            })
        );
    }
});

// Register for background sync
self.registration.addEventListener('updatefound', () => {
    console.log('New Service Worker found, updating...');
});

self.addEventListener('controllerchange', () => {
    console.log('Service Worker controller changed');
});
