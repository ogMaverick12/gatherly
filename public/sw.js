/* global self, caches, fetch */

// The committed placeholder is replaced by scripts/stamp-sw.mjs after a build.
const BUILD_ID = 'dev';

/**
 * Gatherly service worker.
 *
 * Hashed build assets are cache-first. Pages and every other same-origin GET
 * are network-first so a deploy cannot pin an old RSC payload. API routes,
 * RSC requests, Next data routes and range requests are never cached.
 */

const CACHE_PREFIX = 'gatherly-' + BUILD_ID;
const SHELL_CACHE = CACHE_PREFIX + '-shell';
const RUNTIME_CACHE = CACHE_PREFIX + '-runtime';
const SHELL = ['/', '/intake', '/plan', '/manifest.webmanifest', '/icons/icon.svg'];
const MAX_RUNTIME_ENTRIES = 60;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => undefined)
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  if (url.origin !== self.location.origin) return;
  // API routes are per-request and must never be served from a cache.
  if (url.pathname.startsWith('/api/')) return;
  // A stale payload can name chunks that no longer exist, so let the browser
  // handle RSC, Next data and range requests directly.
  if (isUncacheable(request, url)) return;

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

/** True for a request whose response must never enter a cache. */
function isUncacheable(request, url) {
  return (
    request.headers.get('RSC') !== null ||
    url.searchParams.has('_rsc') ||
    url.pathname.startsWith('/_next/data/') ||
    request.headers.get('Range') !== null
  );
}

/** Hashed build assets never change, so the cached copy wins. */
async function cacheFirst(request) {
  const cached = await matchCached(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) await remember(request, response);
  return response;
}

/** Fresh content wins; the cache is only the offline fallback. */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (isCacheable(response)) await remember(request, response);
    return response;
  } catch (error) {
    const cached = await matchCached(request);
    if (cached) return cached;

    if (request.mode === 'navigate') {
      const shell = await caches.open(SHELL_CACHE).then((cache) => cache.match('/'));
      if (shell) return shell;
    }

    throw error;
  }
}

/** Look in the runtime cache first, then the installed shell cache. */
async function matchCached(request) {
  const runtime = await caches.open(RUNTIME_CACHE).then((cache) => cache.match(request));
  if (runtime) return runtime;

  return caches.open(SHELL_CACHE).then((cache) => cache.match(request));
}

/** Only complete, same-origin responses are worth keeping. */
function isCacheable(response) {
  return Boolean(response) && response.status === 200 && response.type === 'basic';
}

/** Store a copy and keep the runtime cache under its entry cap. */
async function remember(request, response) {
  const cache = await caches.open(RUNTIME_CACHE);
  await cache.put(request, response.clone());
  await trimRuntime(cache);
}

/** Evict the oldest entries; Cache.keys() preserves insertion order. */
async function trimRuntime(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_RUNTIME_ENTRIES) return;

  const excess = keys.slice(0, keys.length - MAX_RUNTIME_ENTRIES);
  await Promise.all(excess.map((key) => cache.delete(key)));
}
