// Prospector II — Service Worker
// Minimal SW required for PWA install prompt.
// Just intercepts fetch and passes everything straight through —
// no caching, no offline mode, no interference with the game.

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
self.addEventListener('fetch', e => e.respondWith(fetch(e.request)));
