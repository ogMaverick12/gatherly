import { afterEach, describe, expect, it, vi } from 'vitest';
import { UpstashRateLimiter } from '@/lib/security/rate-limit';

/** The adapter must read the same pair out of whichever reply shape arrives. */

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('the shared limiter reply', () => {
  it('reads the count and the expiry from either pipeline envelope', async () => {
    // Documented /pipeline array, a wrapped batch, and a proxy that unwraps a
    // single-command pipeline: all three carry the same pair.
    const bodies = [[{ result: [4, 12_000] }], { result: [[4, 12_000]] }, { result: [4, 12_000] }];

    for (const body of bodies) {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(JSON.stringify(body), { status: 200 })),
      );
      const limiter = new UpstashRateLimiter('https://redis.test', 'token', 20, 60_000);

      await expect(limiter.check('chat:1')).resolves.toMatchObject({
        allowed: true,
        remaining: 16,
        retryAfterMs: 12_000,
      });
    }
  });
});
