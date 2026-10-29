import { describe, expect, it } from 'vitest';
import { loadWorker } from './sw-harness';
import { makeRequest, ORIGIN } from './sw-caches';

const CACHE_NAME_SUFFIX = '-runtime';
const STATIC_PATH = '/_next/static/chunks/app.js';

/** The runtime cache name, which carries the build id. */
function runtimeCache(worker: ReturnType<typeof loadWorker>): string {
  const name = worker.cacheNames().find((candidate) => candidate.endsWith(CACHE_NAME_SUFFIX));
  if (!name) throw new Error('The worker did not open a runtime cache.');
  return name;
}

describe('the service worker fetch handler', () => {
  it('leaves an API GET to the browser and caches nothing', async () => {
    const worker = loadWorker();
    const served = await worker.dispatch(makeRequest('/api/health'));

    expect(served).toBeUndefined();
    expect(worker.fetchCalls).toHaveLength(0);
    expect(worker.cacheNames()).toEqual([]);
  });

  const uncacheable: Array<[string, string, { headers?: Record<string, string> }]> = [
    ['RSC header', '/plan', { headers: { RSC: '1' } }],
    ['_rsc parameter', '/plan?_rsc=abc', {}],
    ['Next data path', '/_next/data/build/plan.json', {}],
    ['Range header', '/media/clip.mp4', { headers: { Range: 'bytes=0-10' } }],
  ];

  it.each(uncacheable)('never caches a request with an %s', async (_label, path, init) => {
    const worker = loadWorker();
    const served = await worker.dispatch(makeRequest(path, init));

    expect(served).toBeUndefined();
    expect(worker.fetchCalls).toHaveLength(0);
    expect(worker.cacheNames()).toEqual([]);
  });

  it('serves a hashed static asset from the cache on the second request', async () => {
    const worker = loadWorker();
    const url = new URL(STATIC_PATH, ORIGIN).href;

    const first = await worker.dispatch(makeRequest(STATIC_PATH));
    const second = await worker.dispatch(makeRequest(STATIC_PATH));

    expect(first?.body).toBe(`network:${url}`);
    expect(second?.body).toBe(`network:${url}`);
    expect(worker.fetchCalls).toHaveLength(1);
    expect(worker.cacheEntries(runtimeCache(worker))).toEqual([url]);
  });

  it('fetches a navigation online and keeps the fresh copy', async () => {
    const worker = loadWorker();
    await worker.install();

    const served = await worker.dispatch(makeRequest('/plan', { mode: 'navigate' }));

    expect(served?.body).toBe(`network:${new URL('/plan', ORIGIN).href}`);
    expect(worker.cacheEntries(runtimeCache(worker))).toContain(new URL('/plan', ORIGIN).href);
  });

  it('falls back to the installed shell when a navigation is offline', async () => {
    const worker = loadWorker();
    await worker.install();
    worker.setFetch(() => Promise.reject(new Error('offline')));

    const served = await worker.dispatch(makeRequest('/plan', { mode: 'navigate' }));

    expect(served?.body).toBe('shell:/plan');
  });
});

describe('the service worker lifecycle', () => {
  it('deletes caches from other builds on activate', async () => {
    const worker = loadWorker();
    await worker.install();
    await worker.createCache('gatherly-old-build-shell');

    await worker.activate();

    expect(worker.cacheNames()).not.toContain('gatherly-old-build-shell');
    expect(worker.cacheNames().some((name) => name.endsWith('-shell'))).toBe(true);
  });

  it('keeps the runtime cache at 60 entries and evicts the oldest', async () => {
    const worker = loadWorker();
    await worker.install();

    for (let index = 0; index < 61; index += 1) {
      await worker.dispatch(makeRequest(`/_next/static/chunks/chunk-${index}.js`));
    }

    const entries = worker.cacheEntries(runtimeCache(worker));
    expect(entries).toHaveLength(60);
    expect(entries).not.toContain(new URL('/_next/static/chunks/chunk-0.js', ORIGIN).href);
    expect(entries).toContain(new URL('/_next/static/chunks/chunk-60.js', ORIGIN).href);
  });
});
