import type { ProviderErrorKind } from '../ai/provider';
import { logWarn } from './logger';
import { getRateLimiter } from './rate-limit';

/**
 * Shared guards for the API routes.
 *
 * These are the pieces every route needs regardless of what it answers: a
 * rate limit, a stable client key, a deadline and one log line.
 */

/**
 * A failure that maps to a specific HTTP response.
 *
 * `headers` exists because a 429 must still carry the limit and the
 * Retry-After value the caller needs.
 */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
    /** Headers that must reach the client even on the error path. */
    readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

/**
 * A stable key for the caller.
 *
 * `x-real-ip` is set by the platform. Otherwise the LAST `x-forwarded-for`
 * entry is used: a proxy that appends leaves the earlier entries under the
 * client's control, so reading the first one would let a caller rotate it and
 * get a fresh bucket on every request.
 *
 * @param request the incoming request
 * @returns the address the rate limit counts against, or `local`
 */
export function clientKey(request: Request): string {
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const hops = forwarded.split(',').map((hop) => hop.trim());
    const nearest = hops.filter((hop) => hop.length > 0).pop();
    if (nearest) return nearest;
  }
  return 'local';
}

/**
 * Count this request against the caller's bucket.
 *
 * The headers are returned rather than written so they can travel with
 * whichever response the handler produces, including an error.
 *
 * @param request the incoming request
 * @param route the route name, which is part of the bucket key
 * @returns the rate limit headers to send
 * @throws HttpError 429 when the bucket is empty
 */
export async function enforceRateLimit(
  request: Request,
  route: string,
): Promise<{ headers: Record<string, string> }> {
  const limiter = getRateLimiter();
  const result = await limiter.check(`${route}:${clientKey(request)}`);
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
  };
  if (!result.allowed) {
    headers['Retry-After'] = String(Math.max(1, Math.ceil(result.retryAfterMs / 1000)));
    // The headers travel with the error, so the client still learns the
    // limit and when it may try again.
    throw new HttpError(
      429,
      'Too many requests. Please wait a moment.',
      { retryAfterMs: result.retryAfterMs },
      headers,
    );
  }
  return { headers };
}

/** The shape a client-supplied correlation id must have before it is logged. */
const CORRELATION_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/;

/**
 * The id echoed in the request log.
 *
 * A client value is only trusted when it is that shape: it is written into a
 * log line, so anything else could forge or break the line. Otherwise a fresh
 * random id is generated for this request.
 *
 * @param request the incoming request
 * @returns a safe correlation id for the log line
 */
export function correlationId(request: Request): string {
  const supplied = request.headers.get('x-correlation-id');
  if (supplied && CORRELATION_ID_PATTERN.test(supplied)) return supplied;
  return `req_${crypto.randomUUID()}`;
}

/** The route budget. A provider gets 15 s; the route as a whole gets 20 s. */
export const ROUTE_TIMEOUT_MS = 20_000;

/**
 * Bound a unit of work by a deadline.
 *
 * The timer is always cleared, so a fast answer does not keep the event
 * loop alive.
 *
 * @param work the promise to bound
 * @param ms the budget in milliseconds
 * @returns the work's result
 * @throws HttpError 504 when the budget runs out
 */
export async function withTimeout<T>(work: Promise<T>, ms: number = ROUTE_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
          () => reject(new HttpError(504, 'That took too long. Please try again.')),
          ms,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** The fields written for one request. */
export interface RequestLogEvent {
  readonly route: string;
  readonly status: number;
  readonly durationMs: number;
  readonly request: Request;
  readonly providerError?: ProviderErrorKind;
}

/**
 * Log one line per request.
 *
 * Only the route, the status, the duration, the correlation id and - when a
 * provider failed - its failure kind are written. Bodies, prompts, keys,
 * provider messages and the user's own words never reach the log.
 *
 * @param event the request fields to log
 */
export function logRequest(event: RequestLogEvent): void {
  const { route, status, durationMs, request, providerError } = event;
  logWarn({
    app: 'gatherly',
    route,
    status,
    durationMs,
    correlationId: correlationId(request),
    ...(providerError ? { providerError } : {}),
  });
}
