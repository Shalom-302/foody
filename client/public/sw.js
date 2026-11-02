// Service Worker - Noop (PWA disabled by default)
// This SW exists only to clean up after previously installed service workers.
// When a browser that had the old caching SW visits the site, it will pick up
// this new version, clear all caches, and unregister itself.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
      .then(() => console.log('Service Worker cleaned up and unregistered'))
  );
});
