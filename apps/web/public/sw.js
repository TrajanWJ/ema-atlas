const CACHE_NAME = 'place-v1';
const SHELL_URLS = ['/'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first for API routes and dynamic content
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// Handle share target POST
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.pathname === '/share-receiver' && event.request.method === 'POST') {
    event.respondWith(Response.redirect('/?share-incoming=1'));
    event.waitUntil(
      (async () => {
        const formData = await event.request.formData();
        const title = formData.get('shared_title');
        const text = formData.get('shared_text');
        const sharedUrl = formData.get('shared_url');
        const client = await self.clients.get(event.resultingClientId);
        if (client) {
          client.postMessage({ type: 'share-received', data: { title, text, url: sharedUrl } });
        }
      })()
    );
  }
});
