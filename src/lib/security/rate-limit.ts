/**
 * Rate limiting.
 *
 * The default limiter keeps a token bucket in the current process. That is
 * fine for local development and for a single long-running server, but it
 * is *not* safe across serverless instances - each instance would keep its
 * own bucket. The `RateLimiter` interface exists so a shared store can be
 * swapped in; the Upstash Redis adapter is selected automatically when the
 * environment variables are present.
 */

import { readConfig } from '../ai/config';
import { logWarn } from './logger';
import { UpstashRateLimiter } from './upstash-limiter';
import type { RateLimiter, RateLimitResult } from './rate-limit-types';

export type { RateLimiter, RateLimitResult } from './rate-limit-types';

/** A per-process token-bucket limiter with a bounded key map. */
export class InMemoryRateLimiter implements RateLimiter {
  readonly kind = 'memory' as const;

  private readonly buckets = new Map<string, { tokens: number; updatedAt: number }>();

  constructor(
    private readonly capacity = 20,
    private readonly refillPerMinute = 20,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async check(key: string): Promise<RateLimitResult> {
    const now = this.now();
    const refillPerMs = this.refillPerMinute / 60_000;
    const bucket = this.buckets.get(key) ?? { tokens: this.capacity, updatedAt: now };

    const refilled = Math.min(
      this.capacity,
      bucket.tokens + (now - bucket.updatedAt) * refillPerMs,
    );
    const allowed = refilled >= 1;
    const tokens = allowed ? refilled - 1 : refilled;

    this.buckets.set(key, { tokens, updatedAt: now });

    if (this.buckets.size > 5000) {
      // Bound the memory the limiter can use in a long-lived process.
      for (const [bucketKey, value] of this.buckets) {
        if (now - value.updatedAt > 10 * 60_000) this.buckets.delete(bucketKey);
      }
    }

    const retryAfterMs = allowed ? 0 : Math.ceil((1 - tokens) / Math.max(refillPerMs, 0.000001));

    return {
      allowed,
      remaining: Math.max(0, Math.floor(tokens)),
      limit: this.capacity,
      retryAfterMs,
    };
  }
}

export { UpstashRateLimiter };

/** Whether limits use process memory or the shared store. */
export type RateLimitMode = 'shared' | 'per-instance';

/**
 * Which limiter the deployment actually runs.
 *
 * `shared` means the Upstash store is configured and every instance counts
 * against the same bucket. `per-instance` means each serverless instance
 * keeps its own bucket, so the effective limit is a multiple of the intended
 * one. The mode is reported by `GET /api/health` so the state is visible
 * without reading the logs.
 */
export function rateLimitMode(): RateLimitMode {
  const config = readConfig();
  return config.upstashUrl && config.upstashToken ? 'shared' : 'per-instance';
}

/**
 * Warn once at startup when a production deployment runs without the shared
 * store. The warning names the missing variables and nothing else: no
 * request data, no keys.
 */
export function warnWhenRateLimitIsPerInstance(): void {
  if (process.env['NODE_ENV'] !== 'production') return;
  if (rateLimitMode() === 'shared') return;

  logWarn({
    app: 'gatherly',
    event: 'rate_limit_per_instance',
    message:
      'Rate limiting is per-instance because UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is missing. Set both to share the bucket across instances.',
  });
}

let limiter: RateLimiter | null = null;

/**
 * The process-wide limiter, built from the environment on first use.
 * Uses Upstash when configured and the in-memory bucket otherwise.
 *
 * @returns the shared limiter instance
 */
export function getRateLimiter(): RateLimiter {
  if (limiter) return limiter;

  const config = readConfig();

  if (config.upstashUrl && config.upstashToken) {
    limiter = new UpstashRateLimiter({ url: config.upstashUrl, token: config.upstashToken });
  } else {
    limiter = new InMemoryRateLimiter();
  }
  return limiter;
}

/** Test hook: replace the process-wide limiter. */
export function setRateLimiter(next: RateLimiter | null): void {
  limiter = next;
}
