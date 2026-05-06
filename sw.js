/**
 * Från
 * https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Offline_Service_workers (2021-06-09)
 * https://web.dev/offline-cookbook/
 */
const cacheKey = 'cache-v4';

const cacheArray = [
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-180x180.png',
  '/icons/icon-192x192.png',
  '/icons/icon-32x32.png',
  '/icons/icon-48x48.png',
  '/icons/icon-512x512.png',
  '/css/style.css',
  '/js/script.js',
  'https://unpkg.com/mathjs@12.4.1/lib/browser/math.js'
];

self.addEventListener('install', event => {
  console.log('Attempting to install service worker and cache static assets');
  event.waitUntil(
    caches.open(cacheKey)
    .then(cache => {
      return cache.addAll(cacheArray);
    })
  );
});

/** Rensar cache */
self.addEventListener('activate', (e) => {
 e.waitUntil(caches.keys().then((keyList) => {
   return Promise.all(keyList.map((key) => {
     if (key !== cacheKey) {
       return caches.delete(key);
     }
   }));
 }));
});

/** cache-filer först, upddaterar cache från servern */
self.addEventListener('fetch', function (event) {
  // Specialhantering för valutadata: Network First
  // Vi vill ha de absolut senaste kurserna om vi är online.
  if (event.request.url.includes('/api/convert.php')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(cacheKey).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.open(cacheKey).then(function (cache) {
      return cache.match(event.request).then(function (response) {
        var fetchPromise = fetch(event.request).then(function (networkResponse) {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
        return response || fetchPromise;
      });
    }),
  );
});