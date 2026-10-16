const CACHE = 'vibratech-v18-8-static-v1';
const ASSETS = ['./','./index.html','./manifest.webmanifest','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
 event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('vibratech-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
 const request = event.request;
 if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
 event.respondWith(fetch(request).then(response => {
  if (response.ok && new URL(request.url).pathname.endsWith('/index.html')) { const copy=response.clone(); caches.open(CACHE).then(c=>c.put(request,copy)); }
  return response;
 }).catch(() => caches.match(request).then(cached => cached || (request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
