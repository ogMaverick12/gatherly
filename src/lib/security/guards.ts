import type { z } from 'zod';
import { getRateLimiter } from './rate-limit';

/**
 * Shared guards for the API routes.
 *
 * Every route is stateless: a body is read, capped, parsed, validated and
 * answered. Nothing is stored on the server, and every response is marked
 * `no-store` so a proxy or the service worker can never keep a copy.
 */

export const MAX_BODY_BYTES = 16 * 1024;

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

export function jsonResponse(
  data: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  return new Response(JSON.stringify(data), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      ...init.headers,
    },
  });
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return jsonResponse(
      { error: error.message, details: error.details ?? null },
      { status: error.status, headers: error.headers },
    );
  }
  return jsonResponse(
    { error: 'Something went wrong. Please try again.', details: null },
    { status: 500 },
  );
}

async function readBodyWithLimit(request: Request, maxBytes: number): Promise<string> {
  const contentLength = request.headers.get('content-length');
  if (contentLength) {
    const declared = Number(contentLength);
    if (Number.isFinite(declared) && declared > maxBytes) {
      throw new HttpError(413, 'That request is too large.');
    }
  }

  const body = request.body;
  if (!body) return '';

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new HttpError(413, 'That request is too large.');
    }
    chunks.push(value);
  }

  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(combined);
}

export async function readJsonBody<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
  maxBytes = MAX_BODY_BYTES,
): Promise<z.infer<TSchema>> {
  const raw = await readBodyWithLimit(request, maxBytes);
  if (raw.trim() === '') {
    throw new HttpError(400, 'A JSON body is required.');
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'That body is not valid JSON.');
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new HttpError(400, 'Please check the values you sent.', {
      fields: parsed.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
  }
  return parsed.data;
}

/**
 * A stable key for the caller.
 *
 * `x-real-ip` is set by the platform. Otherwise the LAST `x-forwarded-for`
 * entry is used: a proxy that appends leaves the earlier entries under the
 * client's control, so reading the first one would let a caller rotate it and
 * get a fresh bucket on every request.
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

/**
 * Log one line per request.
 *
 * Only the route, the status, the duration and the correlation id are
 * written. Bodies, prompts, keys and the user's own words never reach the
 * log.
 */
export function logRequest(
  route: string,
  status: number,
  durationMs: number,
  request: Request,
): void {
  console.warn(
    JSON.stringify({
      app: 'gatherly',
      route,
      status,
      durationMs,
      correlationId: correlationId(request),
    }),
  );
}

/**
 * Wrap a route handler with the standard guards.
 * The handler receives a validated body and returns a `Response`.
 */
export function withGuards<TSchema extends z.ZodTypeAny>(
  route: string,
  schema: TSchema,
  handler: (body: z.infer<TSchema>, request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    try {
      if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed.' }, { status: 405 });
      }
      const rate = await enforceRateLimit(request, route);
      const body = await readJsonBody(request, schema);
      const response = await handler(body, request);
      for (const [key, value] of Object.entries(rate.headers)) {
        response.headers.set(key, value);
      }
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      return response;
    } catch (error) {
      return errorResponse(error);
    }
  };
}
