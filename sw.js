const CACHE_NAME = 'imortifex-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through minimal service worker agar diakui PWA installable
  event.respondWith(fetch(event.request).catch(() => new Response("Koneksi terputus.")));
});
