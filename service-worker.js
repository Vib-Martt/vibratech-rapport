const CACHE = 'vibratech-v19-13-materiel-signature-photos-sync-historique-v8';
const ASSETS = ["./cloud-sync.js?v=20261019-historique-8", "./", "./index.html", "./manifest.webmanifest", "./icons/icon-180.png", "./icons/icon-192.png", "./icons/icon-512.png", "./css/application.css?v=20261019-historique-8", "./js/telephone.js?v=20261019-historique-8", "./js/photos.js?v=20261019-historique-8", "./js/rapports.js?v=20261019-historique-8", "./js/pdf.js?v=20261019-historique-8", "./js/apercu-pdf.js?v=20261019-historique-8", "./js/clients.js?v=20261019-historique-8", "./js/etapes-rapport.js?v=20261019-historique-8", "./js/navigation.js?v=20261019-historique-8", "./js/recherche-clients.js?v=20261019-historique-8", "./js/installation.js?v=20261019-historique-8"];
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})))).then(() => self.skipWaiting()));
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
