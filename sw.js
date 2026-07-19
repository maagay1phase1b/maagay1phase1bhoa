// Service Worker for Maagay 1 Phase 1-B HOA PWA
// Enables "Add to Home Screen" install prompt on Android/iOS
const CACHE_NAME = 'maagay1-hoa-v2'; // bump this string every time you deploy changes
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];
// Install: cache core files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});
// Activate: clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});
// Fetch: network first, fall back to cache
// Since this is a live CRM talking to Supabase, we always prefer fresh data.
// {cache:'no-store'} forces this to bypass the browser's own HTTP cache too,
// so updates to index.html are picked up immediately instead of silently
// serving a stale cached copy.
self.addEventListener('fetch', e => {
  // Only handle same-origin requests (not Supabase API calls)
  if (!e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-store' })
      .then(res => {
        // Cache a fresh copy of the response
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
