import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import {
  createCaches,
  makeResponse,
  ORIGIN,
  type FakeRequest,
  type FakeResponse,
} from './sw-caches';

const SW_SOURCE = readFileSync(join(process.cwd(), 'public', 'sw.js'), 'utf8');

interface WorkerEvent {
  readonly request?: FakeRequest;
  respondWith(response: Promise<FakeResponse>): void;
  waitUntil(promise: Promise<void>): void;
}

export interface ServiceWorkerHarness {
  readonly fetchCalls: FakeRequest[];
  setFetch(impl: (request: FakeRequest) => Promise<FakeResponse>): void;
  dispatch(request: FakeRequest): Promise<FakeResponse | undefined>;
  install(): Promise<void>;
  activate(): Promise<void>;
  createCache(name: string): Promise<void>;
  cacheNames(): string[];
  cacheEntries(name: string): string[];
}

/** Load public/sw.js with enough of the service worker globals to drive it. */
export function loadWorker(): ServiceWorkerHarness {
  const listeners = new Map<string, (event: WorkerEvent) => void>();
  const caches = createCaches();
  const fetchCalls: FakeRequest[] = [];
  let fetchImpl = (request: FakeRequest) => Promise.resolve(makeResponse(`network:${request.url}`));

  const fetch = (request: FakeRequest): Promise<FakeResponse> => {
    fetchCalls.push(request);
    return fetchImpl(request);
  };

  vm.runInNewContext(SW_SOURCE, {
    self: {
      location: { origin: ORIGIN },
      addEventListener(type: string, handler: (event: WorkerEvent) => void) {
        listeners.set(type, handler);
      },
      skipWaiting: () => Promise.resolve(),
      clients: { claim: () => Promise.resolve() },
    },
    caches,
    fetch,
    URL,
    Promise,
    console,
  });

  const handlerFor = (type: string): ((event: WorkerEvent) => void) => {
    const handler = listeners.get(type);
    if (!handler) throw new Error(`No ${type} handler was registered.`);
    return handler;
  };

  async function lifecycle(type: string): Promise<void> {
    let pending: Promise<void> | undefined;
    handlerFor(type)({
      respondWith() {
        // Lifecycle events do not respond.
      },
      waitUntil(promise) {
        pending = promise;
      },
    });
    if (pending) await pending;
  }

  return {
    fetchCalls,
    setFetch(impl) {
      fetchImpl = impl;
    },
    async dispatch(request) {
      let responded: Promise<FakeResponse> | undefined;
      handlerFor('fetch')({
        request,
        respondWith(response) {
          responded = response;
        },
        waitUntil() {
          // Fetch events do not use waitUntil in this worker.
        },
      });
      return responded ? await responded : undefined;
    },
    install: () => lifecycle('install'),
    activate: () => lifecycle('activate'),
    async createCache(name) {
      await caches.open(name);
    },
    cacheNames: () => caches.names(),
    cacheEntries: (name) => caches.entries(name),
  };
}
