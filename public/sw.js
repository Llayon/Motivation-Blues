/* global self, caches, URL, fetch, Response, Request */

const CACHE_NAME = 'motivation-blues-pwa-v1';
const APP_SHELL_URLS = [
  './',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

function isSameOriginGet(request) {
  return request.method === 'GET' && new URL(request.url).origin === self.location.origin;
}

function isCacheableAsset(url) {
  return (
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('/manifest.webmanifest') ||
    url.pathname.includes('/icons/')
  );
}

async function cacheRequest(request, response) {
  if (!response || !response.ok) {
    return;
  }

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function navigationNetworkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    await cache.put('./', response.clone());
    return response;
  } catch {
    return (await cache.match(request)) ?? (await cache.match('./')) ?? Response.error();
  }
}

async function assetCacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  await cacheRequest(request, response);
  return response;
}

async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  const requests = urls
    .map((url) => new URL(url, self.location.href))
    .filter((url) => url.origin === self.location.origin && !url.pathname.endsWith('/sw.js'))
    .map((url) => new Request(url.toString(), { cache: 'reload' }));

  await Promise.allSettled(
    requests.map(async (request) => {
      const response = await fetch(request);

      if (response.ok) {
        await cache.put(request, response);
      }
    })
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
    event.waitUntil(cacheUrls(event.data.urls));
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (!isSameOriginGet(request)) {
    return;
  }

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(navigationNetworkFirst(request));
    return;
  }

  if (isCacheableAsset(url)) {
    event.respondWith(assetCacheFirst(request));
  }
});
