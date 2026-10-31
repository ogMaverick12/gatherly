/**
 * The contract shared by the in-memory and Upstash rate limiters.
 *
 * It lives in its own module so the adapter and the factory can both depend on
 * it without importing each other.
 */

/** The answer one rate-limit check gives the caller. */
export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly limit: number;
  /** Milliseconds until the caller may try again. */
  readonly retryAfterMs: number;
  /** True when the shared store could not answer and the call was let through. */
  readonly degraded?: boolean;
}

/** A store that can count requests for a key. */
export interface RateLimiter {
  readonly kind: 'memory' | 'upstash';
  check(key: string): Promise<RateLimitResult>;
}
