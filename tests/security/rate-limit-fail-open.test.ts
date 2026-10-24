import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UpstashRateLimiter } from '@/lib/security/rate-limit';

/** The fail-open contract for the shared limiter: allow, mark, warn once. */

const WINDOW_MS = 60_000;

function limiterOn(clock: { now: number }): UpstashRateLimiter {
  return new UpstashRateLimiter('https://redis.test', 'token', 20, WINDOW_MS, () => clock.now);
}

beforeEach(() => {
  // The warning itself is asserted below; keep the other cases quiet.
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the shared limiter failing open', () => {
  it('lets the request through, degraded, when the fetch rejects', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('connect ECONNREFUSED');
      }),
    );

    const result = await limiterOn({ now: 0 }).check('chat:203.0.113.5');

    expect(result).toMatchObject({ allowed: true, degraded: true, retryAfterMs: 0 });
  });

  it('lets the request through, degraded, when the store answers with an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 503 })),
    );

    const result = await limiterOn({ now: 0 }).check('chat:203.0.113.5');

    expect(result).toMatchObject({ allowed: true, degraded: true });
  });

  it('lets the request through, degraded, when a key without expiry cannot be repaired', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const commands = JSON.parse(String(init?.body)) as string[][];
      if (String(commands[0]?.[0]) === 'EVAL') {
        return new Response(JSON.stringify([{ result: [5, -1] }]), { status: 200 });
      }
      return new Response('nope', { status: 500 });
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await limiterOn({ now: 0 }).check('chat:1');

    expect(result).toMatchObject({ allowed: true, degraded: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('writes one fail-open line a minute and no request data', async () => {
    const clock = { now: 1_000_000 };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 503 })),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const limiter = limiterOn(clock);

    await limiter.check('chat:203.0.113.5');
    clock.now += 30_000;
    await limiter.check('chat:203.0.113.5');
    expect(warn).toHaveBeenCalledOnce();

    clock.now += 31_000;
    await limiter.check('chat:203.0.113.5');
    expect(warn).toHaveBeenCalledTimes(2);

    const line = String(warn.mock.calls[0]?.[0]);
    expect(JSON.parse(line)).toEqual({ app: 'gatherly', event: 'rate_limit_fail_open' });
    expect(line).not.toContain('203.0.113.5');
    expect(line).not.toContain('gatherly:ratelimit');
  });
});
