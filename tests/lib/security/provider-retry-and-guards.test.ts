import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ProviderError,
  generateWithRetry,
  type GenerationRequest,
  type GenerationResult,
  type Provider,
} from '@/lib/ai/provider';
import { withTimeout, logRequest, HttpError } from '@/lib/security/guards';
import {
  InMemoryRateLimiter,
  UpstashRateLimiter,
  getRateLimiter,
  setRateLimiter,
} from '@/lib/security/rate-limit';

const REQUEST: GenerationRequest = {
  intent: 'chat',
  systemPrompt: 'system',
  userText: 'hello',
  planSummary: 'summary',
  basicAnswer: 'basic',
};

function providerThat(
  behaviour: (attempt: number) => Promise<GenerationResult> | GenerationResult,
): Provider & { attempts: number } {
  const provider = {
    id: 'gemini' as const,
    attempts: 0,
    async generate(): Promise<GenerationResult> {
      provider.attempts += 1;
      return behaviour(provider.attempts);
    },
    async *stream(): AsyncIterable<string> {
      yield 'streamed';
    },
  };
  return provider;
}

describe('the provider retry', () => {
  it('does not retry a successful call', async () => {
    const provider = providerThat(async () => ({
      mode: 'provider' as const,
      provider: 'gemini' as const,
      content: 'hello',
      notices: [],
    }));

    const result = await generateWithRetry(provider, REQUEST, { sleep: async () => undefined });

    expect(provider.attempts).toBe(1);
    expect(result.content).toBe('hello');
  });

  it('retries once after a retryable failure', async () => {
    const provider = providerThat((attempt) => {
      if (attempt === 1) throw new ProviderError('rate limited', true);
      return {
        mode: 'provider' as const,
        provider: 'gemini' as const,
        content: 'second',
        notices: [],
      };
    });

    const waits: number[] = [];
    const result = await generateWithRetry(provider, REQUEST, {
      sleep: async (ms) => {
        waits.push(ms);
      },
    });

    expect(provider.attempts).toBe(2);
    expect(waits).toEqual([400]);
    expect(result.content).toBe('second');
  });

  it('does not retry a failure that is not retryable', async () => {
    const provider = providerThat(() => {
      throw new ProviderError('bad request', false);
    });

    await expect(
      generateWithRetry(provider, REQUEST, { sleep: async () => undefined }),
    ).rejects.toThrow('bad request');
    expect(provider.attempts).toBe(1);
  });

  it('does not retry an error that is not a provider error', async () => {
    const provider = providerThat(() => {
      throw new Error('boom');
    });

    await expect(
      generateWithRetry(provider, REQUEST, { sleep: async () => undefined }),
    ).rejects.toThrow('boom');
    expect(provider.attempts).toBe(1);
  });

  it('gives up after the one retry', async () => {
    const provider = providerThat(() => {
      throw new ProviderError('still failing', true);
    });

    await expect(
      generateWithRetry(provider, REQUEST, { sleep: async () => undefined }),
    ).rejects.toThrow('still failing');
    expect(provider.attempts).toBe(2);
  });
});

describe('the route timeout', () => {
  it('returns the answer when the work finishes in time', async () => {
    await expect(withTimeout(Promise.resolve('ok'), 1000)).resolves.toBe('ok');
  });

  it('gives up when the work takes too long', async () => {
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve('late'), 50));
    await expect(withTimeout(slow, 5)).rejects.toBeInstanceOf(HttpError);
  });
});

describe('the request log', () => {
  it('writes the route, the status, the duration and the correlation id', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      logRequest({
        route: 'chat',
        status: 200,
        durationMs: 12,
        request: new Request('https://gatherly.test/api/chat'),
      });
      const payload = JSON.parse(String(spy.mock.calls[0]?.[0])) as Record<string, unknown>;

      expect(payload['route']).toBe('chat');
      expect(payload['status']).toBe(200);
      expect(payload['durationMs']).toBe(12);
      expect(String(payload['correlationId'])).toContain('req_');
      expect(Object.keys(payload).sort()).toEqual([
        'app',
        'correlationId',
        'durationMs',
        'route',
        'status',
      ]);
    } finally {
      spy.mockRestore();
    }
  });

  it('never writes the body', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const request = new Request('https://gatherly.test/api/chat', {
        method: 'POST',
        body: 'a secret plan',
      });
      logRequest({ route: 'chat', status: 200, durationMs: 1, request });
      expect(String(spy.mock.calls[0]?.[0])).not.toContain('secret');
    } finally {
      spy.mockRestore();
    }
  });
});

describe('the rate limiter', () => {
  afterEach(() => {
    setRateLimiter(null);
    vi.unstubAllGlobals();
  });

  it('uses the in-process limiter when Upstash is not configured', () => {
    setRateLimiter(null);
    const previousUrl = process.env['UPSTASH_REDIS_REST_URL'];
    const previousToken = process.env['UPSTASH_REDIS_REST_TOKEN'];
    delete process.env['UPSTASH_REDIS_REST_URL'];
    delete process.env['UPSTASH_REDIS_REST_TOKEN'];
    try {
      expect(getRateLimiter().kind).toBe('memory');
    } finally {
      if (previousUrl) process.env['UPSTASH_REDIS_REST_URL'] = previousUrl;
      if (previousToken) process.env['UPSTASH_REDIS_REST_TOKEN'] = previousToken;
    }
  });

  it('uses the shared limiter when Upstash is configured', () => {
    setRateLimiter(null);
    const previousUrl = process.env['UPSTASH_REDIS_REST_URL'];
    const previousToken = process.env['UPSTASH_REDIS_REST_TOKEN'];
    process.env['UPSTASH_REDIS_REST_URL'] = 'https://redis.test';
    process.env['UPSTASH_REDIS_REST_TOKEN'] = 'token';
    try {
      expect(getRateLimiter().kind).toBe('upstash');
    } finally {
      if (previousUrl) process.env['UPSTASH_REDIS_REST_URL'] = previousUrl;
      else delete process.env['UPSTASH_REDIS_REST_URL'];
      if (previousToken) process.env['UPSTASH_REDIS_REST_TOKEN'] = previousToken;
      else delete process.env['UPSTASH_REDIS_REST_TOKEN'];
      setRateLimiter(null);
    }
  });

  it('counts the requests against the shared store', async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(JSON.stringify([{ result: [3, 59_000] }]), { status: 200 }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const limiter = new UpstashRateLimiter({
      url: 'https://redis.test',
      token: 'token',
      capacity: 20,
    });
    const result = await limiter.check('chat:1.2.3.4');

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(17);
    expect(result.retryAfterMs).toBe(59_000);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/pipeline');
  });

  it('blocks the request once the count is over the limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify([{ result: [21, 30_000] }]), { status: 200 })),
    );

    const limiter = new UpstashRateLimiter({
      url: 'https://redis.test',
      token: 'token',
      capacity: 20,
    });
    const result = await limiter.check('chat:1.2.3.4');

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('fails open when the shared store is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 500 })),
    );

    const limiter = new UpstashRateLimiter({
      url: 'https://redis.test',
      token: 'token',
      capacity: 20,
    });
    const result = await limiter.check('chat:1.2.3.4');

    expect(result).toMatchObject({ allowed: true, remaining: 20, degraded: true });
  });

  it('forgets buckets that have been idle for a long time', async () => {
    let now = 0;
    const limiter = new InMemoryRateLimiter(20, 20, () => now);
    for (let index = 0; index < 5100; index += 1) {
      await limiter.check(`key-${index}`);
    }
    expect(limiter['buckets'].size).toBe(5100);

    now = 30 * 60_000;
    await limiter.check('fresh');

    // The idle buckets are dropped, so a long-lived process cannot grow
    // without bound.
    expect(limiter['buckets'].size).toBe(1);
  });
});

describe('the provider selection', () => {
  const before = { ...process.env };

  beforeEach(() => {
    process.env = { ...before };
  });

  afterEach(() => {
    process.env = { ...before };
  });

  it('uses Basic mode when nothing is configured', async () => {
    delete process.env['GATHERLY_AI_PROVIDER'];
    delete process.env['GEMINI_API_KEY'];
    delete process.env['OPENROUTER_API_KEY'];
    const { selectProvider } = await import('@/lib/ai');
    const selection = selectProvider();
    expect(selection.provider.id).toBe('basic');
    expect(selection.live).toBe(false);
    expect(selection.notice).toContain('Basic mode');
  });

  it('names the provider that is missing its key', async () => {
    process.env['GATHERLY_AI_PROVIDER'] = 'gemini';
    delete process.env['GEMINI_API_KEY'];
    const { selectProvider } = await import('@/lib/ai');
    expect(selectProvider().notice).toContain('Gemini');
  });

  it('names the other provider that is missing its key', async () => {
    process.env['GATHERLY_AI_PROVIDER'] = 'openrouter';
    delete process.env['OPENROUTER_API_KEY'];
    const { selectProvider } = await import('@/lib/ai');
    expect(selectProvider().notice).toContain('OpenRouter');
  });

  it('goes live when the key is there', async () => {
    process.env['GATHERLY_AI_PROVIDER'] = 'gemini';
    process.env['GEMINI_API_KEY'] = 'key';
    const { selectProvider } = await import('@/lib/ai');
    const selection = selectProvider();
    expect(selection.live).toBe(true);
    expect(selection.provider.id).toBe('gemini');
  });
});
