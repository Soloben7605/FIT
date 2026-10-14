// Service worker: keeps a copy of the app on the phone so it opens with no signal.
// Strategy: serve from cache instantly, then quietly fetch a fresh copy in the
// background for next time (so updates show up on the second open after you upload).

// Bump the version number whenever you add or rename a file in FILES.
const CACHE = 'fit-v2';
const FILES = ['./', './index.html', './chart.umd.min.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-180.png'];

self.addEventListener('install', e => {
  // cache: 'reload' skips the browser's own cache so we always store the latest upload
  const requests = FILES.map(f => new Request(f, { cache: 'reload' }));
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(requests)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // Remove caches from older versions
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async cache => {
      const cached = await cache.match(e.request, { ignoreSearch: true });
      const fresh = fetch(e.request)
        .then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; })
        .catch(() => cached);
      return cached || fresh;
    })
  );
});
