import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { jsonResponse } from '@/lib/security/http';
import { createRoute } from '@/lib/security/route';
import { setRateLimiter, UpstashRateLimiter } from '@/lib/security/rate-limit';

/**
 * The shared limiter against a fake Redis on a virtual clock.
 *
 * The fake implements only what the limiter is allowed to send: the one-shot
 * incremental-and-expire EVAL, plus PEXPIRE for repair. Anything else throws,
 * so a regression to a pipeline of separate commands is a red test.
 */

const WINDOW_MS = 60_000;
const CAPACITY = 20;

interface FakeEntry {
  count: number;
  expiresAt: number | null;
}

function fakeRedis(clock: { now: number }) {
  const keys = new Map<string, FakeEntry>();

  function live(key: string): FakeEntry | undefined {
    const entry = keys.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && clock.now >= entry.expiresAt) {
      keys.delete(key);
      return undefined;
    }
    return entry;
  }

  const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
    const commands = JSON.parse(String(init?.body)) as string[][];
    const results = commands.map((command) => {
      const name = String(command[0]);

      if (name === 'EVAL') {
        const script = String(command[1]);
        const key = String(command[3]);
        const windowMs = Number(command[4]);
        if (!script.includes("redis.call('INCR'") || !script.includes('c == 1')) {
          throw new Error('unexpected EVAL script');
        }

        const entry = live(key) ?? { count: 0, expiresAt: null };
        entry.count += 1;

        // Emulate the PEXPIRE calls the script really makes: one inside the
        // `if c == 1` guard only opens a new window, while an unguarded one
        // restarts it on every request - the defect these tests exist for.
        for (const line of script.split('\n')) {
          if (!line.includes("redis.call('PEXPIRE'")) continue;
          const guarded = line.trim().startsWith('if ');
          if (!guarded || entry.count === 1) entry.expiresAt = clock.now + windowMs;
        }

        keys.set(key, entry);
        return [entry.count, entry.expiresAt === null ? -1 : entry.expiresAt - clock.now];
      }

      if (name === 'PEXPIRE') {
        const entry = keys.get(String(command[1]));
        if (!entry) return 0;
        entry.expiresAt = clock.now + Number(command[2]);
        return 1;
      }

      throw new Error(`unexpected command ${name}`);
    });

    // The documented /pipeline shape: one entry per command.
    const body = results.map((result) => ({ result }));
    return new Response(JSON.stringify(body), { status: 200 });
  });

  return { fetchMock, keys };
}

function limiterOn(clock: { now: number }): UpstashRateLimiter {
  return new UpstashRateLimiter({
    url: 'https://redis.test',
    token: 'token',
    capacity: CAPACITY,
    windowMs: WINDOW_MS,
    now: () => clock.now,
  });
}

beforeEach(() => {
  // The fail-open warning is asserted in its own file; keep this run quiet.
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  setRateLimiter(null);
});

describe('the shared limiter window', () => {
  it('never blocks a steady client that stays under the limit', async () => {
    const clock = { now: 0 };
    const redis = fakeRedis(clock);
    vi.stubGlobal('fetch', redis.fetchMock);
    const limiter = limiterOn(clock);

    // One request every 10 s for 10 minutes: at most 6 in any window.
    for (let second = 0; second <= 600; second += 10) {
      clock.now = second * 1000;
      const result = await limiter.check('chat:203.0.113.5');
      expect(result.allowed, `blocked at ${second} s`).toBe(true);
      expect(result.degraded).toBeUndefined();
    }

    expect(redis.fetchMock).toHaveBeenCalledTimes(61);
    const body = JSON.parse(String(redis.fetchMock.mock.calls[0]?.[1]?.body)) as unknown[][];
    expect(body).toHaveLength(1);
    expect(body[0]?.[0]).toBe('EVAL');
  });

  it('blocks exactly five of a burst of 25 and says how long the window has left', async () => {
    const clock = { now: 0 };
    const redis = fakeRedis(clock);
    vi.stubGlobal('fetch', redis.fetchMock);
    setRateLimiter(limiterOn(clock));

    const handler = createRoute({
      name: 'chat',
      schema: z.object({ ok: z.boolean() }),
      handler: async () => jsonResponse({ ok: true }),
    });
    const request = () =>
      new Request('https://gatherly.test/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-real-ip': '203.0.113.5' },
        body: JSON.stringify({ ok: true }),
      });

    const statuses: number[] = [];
    for (let index = 0; index < CAPACITY; index += 1) {
      statuses.push((await handler(request())).status);
    }

    // Five seconds in, the refused requests must quote the time left, not a
    // fresh minute: the window is not extended by their own arrival.
    clock.now = 5_000;
    let refusal: Response | undefined;
    for (let index = 0; index < 5; index += 1) {
      const response = await handler(request());
      statuses.push(response.status);
      if (!refusal) refusal = response;
    }

    expect(statuses.filter((status) => status === 200)).toHaveLength(20);
    expect(statuses.filter((status) => status === 429)).toHaveLength(5);
    expect(refusal?.headers.get('Retry-After')).toBe('55');
  });

  it('resets the counter when the window ends', async () => {
    const clock = { now: 0 };
    const redis = fakeRedis(clock);
    vi.stubGlobal('fetch', redis.fetchMock);
    const limiter = limiterOn(clock);

    for (let index = 0; index < CAPACITY; index += 1) {
      await expect(limiter.check('chat:1')).resolves.toMatchObject({ allowed: true });
    }
    await expect(limiter.check('chat:1')).resolves.toMatchObject({ allowed: false });

    clock.now = WINDOW_MS;
    const reset = await limiter.check('chat:1');
    expect(reset.allowed).toBe(true);
    expect(reset.remaining).toBe(CAPACITY - 1);
  });

  it('re-arms a key that lost its expiry so it cannot count forever', async () => {
    const clock = { now: 0 };
    const redis = fakeRedis(clock);
    vi.stubGlobal('fetch', redis.fetchMock);
    redis.keys.set('gatherly:ratelimit:chat:1', { count: 4, expiresAt: null });

    const result = await limiterOn(clock).check('chat:1');

    expect(result.allowed).toBe(true);
    expect(result.retryAfterMs).toBe(WINDOW_MS);
    expect(redis.keys.get('gatherly:ratelimit:chat:1')?.expiresAt).toBe(WINDOW_MS);
  });
});
