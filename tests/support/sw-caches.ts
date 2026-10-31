/** The origin every fake request uses. */
export const ORIGIN = 'https://gatherly.example';

interface FetchInit {
  readonly method?: string;
  readonly mode?: string;
  readonly headers?: Record<string, string>;
}

export interface FakeRequest {
  readonly url: string;
  readonly method: string;
  readonly mode: string;
  readonly headers: { get(name: string): string | null };
  clone(): FakeRequest;
}

export interface FakeResponse {
  readonly body: string;
  readonly status: number;
  readonly type: string;
  clone(): FakeResponse;
}

interface FakeCache {
  put(request: FakeRequest, response: FakeResponse): Promise<void>;
  addAll(paths: string[]): Promise<void>;
  keys(): Promise<FakeRequest[]>;
  match(request: FakeRequest | string): Promise<FakeResponse | undefined>;
  delete(request: FakeRequest): Promise<boolean>;
}

export interface FakeCaches {
  open(name: string): Promise<FakeCache>;
  keys(): Promise<string[]>;
  delete(name: string): Promise<boolean>;
  match(request: FakeRequest | string): Promise<FakeResponse | undefined>;
  names(): string[];
  entries(name: string): string[];
}

export function makeRequest(path: string, init: FetchInit = {}): FakeRequest {
  const url = path.startsWith('http') ? path : new URL(path, ORIGIN).href;
  const headers = new Map(
    Object.entries(init.headers ?? {}).map(([key, value]) => [key.toLowerCase(), value]),
  );

  return {
    url,
    method: init.method ?? 'GET',
    mode: init.mode ?? 'cors',
    headers: { get: (name) => headers.get(name.toLowerCase()) ?? null },
    clone: () => makeRequest(url, init),
  };
}

export function makeResponse(body: string, status = 200, type = 'basic'): FakeResponse {
  return { body, status, type, clone: () => makeResponse(body, status, type) };
}

const urlOf = (request: FakeRequest | string): string =>
  typeof request === 'string' ? new URL(request, ORIGIN).href : request.url;

const cacheFor = (store: Map<string, FakeResponse>): FakeCache => ({
  put(request, response) {
    store.set(request.url, response);
    return Promise.resolve();
  },
  addAll(paths) {
    for (const path of paths) store.set(urlOf(path), makeResponse(`shell:${path}`));
    return Promise.resolve();
  },
  keys() {
    return Promise.resolve([...store.keys()].map((url) => makeRequest(url)));
  },
  match(request) {
    return Promise.resolve(store.get(urlOf(request)));
  },
  delete(request) {
    return Promise.resolve(store.delete(request.url));
  },
});

export function createCaches(): FakeCaches {
  const stores = new Map<string, Map<string, FakeResponse>>();

  return {
    open(name) {
      let store = stores.get(name);
      if (!store) {
        store = new Map();
        stores.set(name, store);
      }
      return Promise.resolve(cacheFor(store));
    },
    keys() {
      return Promise.resolve([...stores.keys()]);
    },
    delete(name) {
      return Promise.resolve(stores.delete(name));
    },
    match(request) {
      const url = urlOf(request);
      for (const store of stores.values()) {
        const found = store.get(url);
        if (found) return Promise.resolve(found);
      }
      return Promise.resolve(undefined);
    },
    names() {
      return [...stores.keys()];
    },
    entries(name) {
      return [...(stores.get(name)?.keys() ?? [])];
    },
  };
}
