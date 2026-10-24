import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as AiModule from '@/lib/ai';
import type { GenerationResult } from '@/lib/ai/provider';

const selectProvider = vi.fn();

vi.mock('@/lib/ai', async () => {
  const actual = await vi.importActual<typeof AiModule>('@/lib/ai');
  return { ...actual, selectProvider: (...args: unknown[]) => selectProvider(...args) };
});

vi.mock('@/lib/ai/gemini', () => ({ GeminiProvider: class {} }));
vi.mock('@/lib/ai/openrouter', () => ({ OpenRouterProvider: class {} }));

const { GET: health } = await import('@/app/api/health/route');
const { InMemoryRateLimiter, rateLimitMode, setRateLimiter, warnWhenRateLimitIsPerInstance } =
  await import('@/lib/security/rate-limit');

/**
 * The health route.
 *
 * The point of every case here is that the deployment state is visible from
 * outside: which provider answers, and whether the rate limit is shared.
 */

function selection(providerId: 'basic' | 'gemini' | 'openrouter') {
  return {
    provider: {
      id: providerId,
      generate: vi.fn(async (): Promise<GenerationResult> => ({
        mode: 'basic' as const,
        provider: 'basic' as const,
        content: '',
        notices: [],
      })),
    },
    live: providerId !== 'basic',
    notice: null,
  };
}

function request(client: string): Request {
  return new Request('https://gatherly.test/api/health', {
    method: 'GET',
    headers: { 'x-forwarded-for': client },
  });
}

beforeEach(() => {
  selectProvider.mockReset();
  selectProvider.mockReturnValue(selection('basic'));
  // The shared-store limiter would reach the network. The route only needs
  // a bucket, so the in-process one stands in for both modes.
  setRateLimiter(new InMemoryRateLimiter());
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  setRateLimiter(null);
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('GET /api/health', () => {
  it('reports the provider mode and the shared rate limiter', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.test');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token');
    selectProvider.mockReturnValue(selection('gemini'));

    const response = await health(request('10.0.0.1'));
    const body = (await response.json()) as { ok: boolean; mode: string; rateLimit: string };

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true, mode: 'gemini', rateLimit: 'shared' });
  });

  it('reports the per-instance rate limiter when the shared store is missing', async () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    const response = await health(request('10.0.0.2'));
    const body = (await response.json()) as { ok: boolean; mode: string; rateLimit: string };

    expect(body).toEqual({ ok: true, mode: 'basic', rateLimit: 'per-instance' });
  });

  it('never caches the answer', async () => {
    const response = await health(request('10.0.0.3'));

    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('answers 429 when the bucket is empty', async () => {
    setRateLimiter(new InMemoryRateLimiter(1, 1));
    const first = await health(request('10.0.0.4'));
    const second = await health(request('10.0.0.4'));

    expect(first.status).toBe(200);
    expect(second.status).toBe(429);
    expect(second.headers.get('retry-after')).toBeTruthy();
  });
});

describe('the rate limit mode', () => {
  it('is shared when both Upstash variables are set', () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.test');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token');

    expect(rateLimitMode()).toBe('shared');
  });

  it('is per-instance when either Upstash variable is missing', () => {
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.test');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    expect(rateLimitMode()).toBe('per-instance');
  });
});

describe('the startup warning', () => {
  it('warns once when production runs without the shared store', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    warnWhenRateLimitIsPerInstance();

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(
      String((console.warn as unknown as ReturnType<typeof vi.fn>).mock.calls[0]?.[0]),
    ).toContain('UPSTASH_REDIS_REST_URL');
  });

  it('stays quiet when the shared store is configured', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', 'https://redis.test');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', 'token');

    warnWhenRateLimitIsPerInstance();

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('stays quiet outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

    warnWhenRateLimitIsPerInstance();

    expect(console.warn).not.toHaveBeenCalled();
  });
});
