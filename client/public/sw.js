const CACHE_NAME = 'emblazers-static-v1';
const PAGES_CACHE = 'emblazers-pages-v1';
const API_CACHE = 'emblazers-api-v1';

const OFFLINE_URL = '/offline.html';

const PAGES_TO_CACHE = [
  '/',
  '/hr/dashboard',
  '/student/dashboard',
  '/fee/dashboard',
  '/attendance/dashboard',
  '/staff/dashboard',
  '/parent/login',
  '/staff/login',
  '/offline.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PAGES_CACHE);
      for (const url of PAGES_TO_CACHE) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn('SW: Failed to cache', url, e.message);
        }
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME && name !== PAGES_CACHE)
          .map(name => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    if (request.method === 'POST' && url.pathname.includes('/api/attendance')) {
      event.respondWith(
        fetch(request.clone()).catch(async () => {
          const body = await request.clone().text();
          await saveToSyncQueue({ url: request.url, method: 'POST', body, timestamp: Date.now() });
          return new Response(JSON.stringify({ queued: true, message: 'Will sync when online' }), {
            status: 202,
            headers: { 'Content-Type': 'application/json' }
          });
        })
      );
      return;
    }
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstForPages(request));
    return;
  }

  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|woff2?|ttf|eot|ico)$/)
  ) {
    event.respondWith(cacheFirstWithNetwork(request, CACHE_NAME));
    return;
  }
});

async function networkFirstForPages(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(PAGES_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (e) {
    return new Response('', { status: 503 });
  }
}

async function saveToSyncQueue(data) {
  try {
    const db = await openSyncDB();
    const tx = db.transaction('sync-queue', 'readwrite');
    tx.objectStore('sync-queue').add(data);
    await tx.complete;
  } catch (e) {
    console.warn('SW: Failed to save to sync queue', e);
  }
}

function openSyncDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('emblazers-sync', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('sync-queue', { keyPath: 'timestamp' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'attendance-sync') {
    event.waitUntil(replayQueuedRequests());
  }
});

async function replayQueuedRequests() {
  try {
    const db = await openSyncDB();
    const tx = db.transaction('sync-queue', 'readonly');
    const store = tx.objectStore('sync-queue');
    const items = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    for (const item of items) {
      try {
        await fetch(item.url, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: item.body
        });
        const deleteTx = db.transaction('sync-queue', 'readwrite');
        deleteTx.objectStore('sync-queue').delete(item.timestamp);
      } catch (e) {
        console.warn('SW: Sync retry failed for', item.url);
      }
    }
  } catch (e) {
    console.warn('SW: Replay failed', e);
  }
}

self.addEventListener('push', (event) => {
  let data = { title: 'Emblazers SMS', body: 'You have a new notification' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Emblazers SMS', {
      body: data.body || 'New notification',
      icon: '/icon-192.svg',
      badge: '/icon-192.svg',
      tag: data.tag || 'general',
      data: data.url ? { url: data.url } : undefined
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
