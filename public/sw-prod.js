// Production Service Worker for German Learning App
const CACHE_NAME = 'german-learn-v1.0.0'
const STATIC_CACHE = 'static-v1.0.0'
const DYNAMIC_CACHE = 'dynamic-v1.0.0'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/index.css',
  '/assets/index.js'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => self.skipWaiting())
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  
  // Skip non-GET requests
  if (request.method !== 'GET') return
  
  // Skip external requests
  if (!request.url.startsWith(self.location.origin)) return
  
  event.respondWith(
    caches.match(request)
      .then(response => {
        // Return cached version if available
        if (response) {
          // For HTML files, always try network first (stale-while-revalidate)
          if (request.destination === 'document') {
            fetchAndCache(request)
            return response
          }
          return response
        }
        
        // For static assets, cache and return
        if (request.destination === 'script' || 
            request.destination === 'style' || 
            request.destination === 'image') {
          return fetchAndCache(request)
        }
        
        // For other requests, try network first
        return fetch(request)
          .catch(() => {
            // Return offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match('/offline.html')
            }
          })
      })
  )
})

// Helper function to fetch and cache
function fetchAndCache(request) {
  return fetch(request)
    .then(response => {
      // Only cache successful responses
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response
      }
      
      // Clone response since it can only be consumed once
      const responseToCache = response.clone()
      
      // Determine which cache to use
      const cacheName = request.destination === 'document' ? DYNAMIC_CACHE : STATIC_CACHE
      
      caches.open(cacheName)
        .then(cache => {
          cache.put(request, responseToCache)
        })
      
      return response
    })
    .catch(error => {
      console.error('Service Worker: Fetch failed:', error)
      throw error
    })
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync:', event.tag)
  
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgressData())
  }
})

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received')
  
  const options = {
    body: event.data ? event.data.text() : 'New learning material available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('German Learn', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click')
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Sync progress data when online
async function syncProgressData() {
  try {
    // Get offline progress data from IndexedDB
    const offlineData = await getOfflineProgressData()
    
    if (offlineData.length > 0) {
      // Send to server
      await fetch('/api/sync-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(offlineData)
      })
      
      // Clear offline data after successful sync
      await clearOfflineProgressData()
    }
  } catch (error) {
    console.error('Service Worker: Sync failed:', error)
  }
}

// IndexedDB helpers for offline progress
function getOfflineProgressData() {
  return new Promise((resolve) => {
    const request = indexedDB.open('germanLearnOfflineDB', 1)
    
    request.onsuccess = (event) => {
      const db = event.target.result
      const transaction = db.transaction(['progress'], 'readonly')
      const store = transaction.objectStore('progress')
      const getAllRequest = store.getAll()
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result)
      getAllRequest.onerror = () => resolve([])
    }
    
    request.onerror = () => resolve([])
  })
}

function clearOfflineProgressData() {
  return new Promise((resolve) => {
    const request = indexedDB.open('germanLearnOfflineDB', 1)
    
    request.onsuccess = (event) => {
      const db = event.target.result
      const transaction = db.transaction(['progress'], 'readwrite')
      const store = transaction.objectStore('progress')
      const clearRequest = store.clear()
      
      clearRequest.onsuccess = () => resolve(true)
      clearRequest.onerror = () => resolve(false)
    }
    
    request.onerror = () => resolve(false)
  })
}

// Cache cleanup for old data
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_UPDATED') {
    // Clear dynamic cache when content is updated
    caches.open(DYNAMIC_CACHE)
      .then(cache => {
        cache.keys().then(keys => {
          keys.forEach(request => {
            if (request.url.includes(event.data.url)) {
              cache.delete(request)
            }
          })
        })
      })
  }
})