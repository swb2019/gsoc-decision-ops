/* Optional, explicit offline pack. This worker never reads sessions, decisions, or microphone data. */
const GLASSHOUSE_CONTROL_CACHE = 'hourglass-glasshouse:control:v1';
const scope = new URL(self.registration.scope);
const pointerUrl = new URL('__glasshouse-active-pack.json', scope).href;
const markerUrl = new URL('__glasshouse-complete-pack.json', scope).href;

self.addEventListener('message', (event) => {
  if (event.data?.type === 'glasshouse-safe-activate') self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
self.addEventListener('fetch', (event) => {
  const requested = new URL(event.request.url);
  if (
    event.request.method !== 'GET' ||
    requested.origin !== scope.origin ||
    !requested.pathname.startsWith(scope.pathname)
  )
    return;
  // Explicit pack downloads must reach the newly published bytes, not recycle the active older pack.
  if (event.request.cache === 'no-store') return;
  event.respondWith(
    (async () => {
      const control = await caches.open(GLASSHOUSE_CONTROL_CACHE);
      const pointer = await control.match(pointerUrl);
      if (!pointer) return fetch(event.request);
      let metadata;
      try {
        metadata = await pointer.json();
      } catch {
        return fetch(event.request);
      }
      if (
        typeof metadata.cacheName !== 'string' ||
        !metadata.cacheName.startsWith('hourglass-glasshouse:pack:')
      )
        return fetch(event.request);
      const cache = await caches.open(metadata.cacheName);
      const marker = await cache.match(markerUrl);
      if (!marker) return fetch(event.request);
      let manifest;
      try {
        manifest = await marker.json();
      } catch {
        return fetch(event.request);
      }
      if (
        manifest.scope !== scope.pathname ||
        manifest.version !== metadata.version ||
        !Array.isArray(manifest.assets)
      )
        return fetch(event.request);
      let path = requested.pathname;
      if (event.request.headers.get('RSC') === '1' && path.endsWith('/')) path += 'index.txt';
      if (!manifest.assets.some((asset) => asset.path === path)) return fetch(event.request);
      const cached = await cache.match(new URL(path, scope.origin).href);
      return cached ?? fetch(event.request);
    })()
  );
});
