const CACHE_NAME = 'german-learning-v1';
const urlsToCache = [
  '/',
  '/assets/index-D4TFdbmx.css',
  '/assets/index-B-RPp1CR.js',
  '/assets/react-vendor-BknbrQgO.js',
  '/assets/pdf-processor-C4ZDs4Fm.js',
  '/data/vocabulary-database.json',
  '/data/grammar-database.json',
  '/data/pronunciation-database.json',
  '/data/reading-passages.json',
  '/data/writing-tasks.json',
  '/data/listening-scripts.json',
  '/data/podcasts.json',
  '/data/speaking-tips.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        // Make network request
        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Open cache and add response
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Activate event - remove old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});