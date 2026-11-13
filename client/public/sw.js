const CACHE_PREFIX = 'myconvertertool-pwa-';
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const CORE_ROUTES = [
  '/',
  '/tools',
  '/tools/pdf-converter',
  '/tools/excel-pdf',
  '/tools/markdown-to-docx',
  '/tools/json-formatter',
];
const CORE_FILES = [
  '/offline.html',
  '/site.webmanifest',
  '/favicon.ico',
  '/assets/android-chrome-192x192.png',
  '/assets/android-chrome-512x512.png',
  '/assets/apple-touch-icon.png',
  '/assets/pwa-maskable.svg',
  '/fonts/material-icons-8265f64786.woff2',
];

const appResourcesFrom = (html) => {
  const resources = new Set();
  const tags = html.match(/<(?:link|script)\b[^>]*>/gi) || [];

  for (const tag of tags) {
    if (tag.startsWith('<link') && !/rel=["'](?:modulepreload|stylesheet)["']/.test(tag)) continue;
    if (tag.startsWith('<script') && !/\bsrc=/.test(tag)) continue;
    const path = tag.match(/(?:href|src)=["']([^"']+)["']/)?.[1];
    if (!path) continue;

    const url = new URL(path, self.location.origin);
    if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) resources.add(url.href);
  }

  return resources;
};

const storeSuccessfulResponse = async (cache, request, response) => {
  if (response?.ok && response.type === 'basic') {
    await cache.put(request, response.clone());
  }
};

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_FILES.map(path => new URL(path, self.location.origin)));

    const resources = new Set();
    for (const route of CORE_ROUTES) {
      const request = new Request(new URL(route, self.location.origin), { cache: 'reload' });
      try {
        const response = await fetch(request);
        if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) continue;
        const html = await response.clone().text();
        await cache.put(new URL(route, self.location.origin), response);
        for (const resource of appResourcesFrom(html)) resources.add(resource);
      } catch {
        // A route that is unavailable during install will be cached when visited online.
      }
    }

    await Promise.allSettled([...resources].map(async (url) => {
      const request = new Request(url, { cache: 'reload' });
      const response = await fetch(request);
      await storeSuccessfulResponse(cache, url, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    if (/^\/(?:admin|profile|login|register)(?:\/|$)/.test(url.pathname)) return;

    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cacheKey = new Request(new URL(url.pathname, self.location.origin));
      try {
        const response = await fetch(request);
        if (response.ok && response.headers.get('content-type')?.includes('text/html')) {
          await cache.put(cacheKey, response.clone());
        }
        return response;
      } catch {
        return await cache.match(cacheKey) || await cache.match(new URL('/offline.html', self.location.origin));
      }
    })());
    return;
  }

  const isStaticAsset = url.pathname.startsWith('/assets/')
    || url.pathname.startsWith('/fonts/')
    || url.pathname.startsWith('/cmaps/')
    || url.pathname === '/pdf.worker.min.js'
    || url.pathname === '/site.webmanifest'
    || url.pathname === '/favicon.ico';
  if (!isStaticAsset) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    await storeSuccessfulResponse(cache, request, response);
    return response;
  })());
});
