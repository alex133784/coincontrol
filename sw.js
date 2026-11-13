const CACHE_NAME = 'coincontrol-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/tokens.css',
  './css/main.css',
  './js/app.js',
  './js/storage.js',
  './js/finance.js',
  './js/charts.js',
  './js/ui.js',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});