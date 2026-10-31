/**
 * The shared rate limiter, backed by Upstash Redis over its REST API.
 *
 * The count and the window expiry are written by one Lua script so the limit
 * is a fixed window: the expiry is set when the key is created, never
 * refreshed by later requests. That is what stops a steady client from
 * extending its own window forever, and it keeps the read-modify-write
 * atomic instead of a pipeline of three independent commands.
 */

import { logWarn } from './logger';
import type { RateLimiter, RateLimitResult } from './rate-limit-types';

/**
 * Count, and start the window only when the counter is created.
 * Returns `[count, pttl]` so the caller also learns when the window ends.
 */
const FIXED_WINDOW_SCRIPT = `local c = redis.call('INCR', KEYS[1])
if c == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
return {c, redis.call('PTTL', KEYS[1])}`;

const FAIL_OPEN_WARN_INTERVAL_MS = 60_000;
const DEFAULT_CAPACITY = 20;
const DEFAULT_WINDOW_MS = 60_000;

/** The store endpoint and policy for one shared limiter. */
export interface UpstashRateLimiterOptions {
  readonly url: string;
  readonly token: string;
  readonly capacity?: number;
  readonly windowMs?: number;
  readonly now?: () => number;
}

interface UpstashResponse {
  result?: unknown;
  error?: string;
}

/**
 * The per-command results of a `/pipeline` reply.
 *
 * Upstash documents a top-level array of `{ result }` entries; a gateway that
 * wraps the batch as `{ result: [...] }` is accepted too, because the adapter
 * must not fail open merely because of the envelope.
 */
function pipelineEntries(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload.map((entry) =>
      entry !== null && typeof entry === 'object' && 'result' in entry
        ? (entry as UpstashResponse).result
        : entry,
    );
  }
  if (payload !== null && typeof payload === 'object' && 'result' in payload) {
    const wrapped = (payload as UpstashResponse).result;
    if (Array.isArray(wrapped)) return wrapped;
  }
  return [];
}

/**
 * Read `[count, pttl]` from the EVAL reply.
 *
 * An EVAL array result arrives nested inside its pipeline entry, but a store
 * or proxy that unwraps a single-command pipeline sends the pair flat, so both
 * shapes are read.
 */
function readCountAndTtl(reply: unknown[]): [number, number] {
  const first = reply[0];
  const pair = Array.isArray(first) ? first : reply;
  return [Number(pair[0] ?? 0), Number(pair[1] ?? -1)];
}

/** A fixed-window limiter backed by the shared Upstash store. */
export class UpstashRateLimiter implements RateLimiter {
  readonly kind = 'upstash' as const;

  private readonly url: string;
  private readonly token: string;
  private readonly capacity: number;
  private readonly windowMs: number;
  private readonly now: () => number;
  private lastFailOpenWarnAt = Number.NEGATIVE_INFINITY;

  constructor({
    url,
    token,
    capacity = DEFAULT_CAPACITY,
    windowMs = DEFAULT_WINDOW_MS,
    now = () => Date.now(),
  }: UpstashRateLimiterOptions) {
    this.url = url;
    this.token = token;
    this.capacity = capacity;
    this.windowMs = windowMs;
    this.now = now;
  }

  /**
   * Count one request in the current fixed window.
   *
   * Fails open - allowed, with `degraded: true` - when the store answers with
   * an error, rejects the fetch or times out. The body cap and the provider
   * timeout still bound a request that gets through this way.
   */
  async check(key: string): Promise<RateLimitResult> {
    const redisKey = `gatherly:ratelimit:${key}`;

    try {
      const reply = await this.send([
        ['EVAL', FIXED_WINDOW_SCRIPT, '1', redisKey, String(this.windowMs)],
      ]);
      if (!reply) return this.failOpen();

      const [count, pttl] = readCountAndTtl(reply);
      let ttl = pttl;

      if (ttl === -1) {
        // A key without an expiry would count requests forever. Give it this
        // window now; if that cannot be written, the limit is not real.
        if (!(await this.send([['PEXPIRE', redisKey, String(this.windowMs)]]))) {
          return this.failOpen();
        }
        ttl = this.windowMs;
      }

      return {
        allowed: count <= this.capacity,
        remaining: Math.max(0, this.capacity - count),
        limit: this.capacity,
        retryAfterMs: Math.max(0, ttl),
      };
    } catch {
      return this.failOpen();
    }
  }

  private failOpen(): RateLimitResult {
    this.warnFailOpen();
    return {
      allowed: true,
      remaining: this.capacity,
      limit: this.capacity,
      retryAfterMs: 0,
      degraded: true,
    };
  }

  private warnFailOpen(): void {
    const now = this.now();
    if (now - this.lastFailOpenWarnAt < FAIL_OPEN_WARN_INTERVAL_MS) return;
    this.lastFailOpenWarnAt = now;
    // An outage is a property of the store: no key, no address, no user text.
    logWarn({ app: 'gatherly', event: 'rate_limit_fail_open' });
  }

  private async send(commands: unknown[][]): Promise<unknown[] | null> {
    const response = await fetch(`${this.url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });

    if (!response.ok) return null;
    return pipelineEntries(await response.json());
  }
}
