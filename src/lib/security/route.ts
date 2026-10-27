import type { z } from 'zod';
import type { ProviderErrorKind } from '../ai/provider';
import { enforceRateLimit, logRequest, ROUTE_TIMEOUT_MS, withTimeout } from './guards';
import { errorResponse, jsonResponse, NO_STORE, readJsonBody } from './http';

/**
 * The one route factory.
 *
 * Every API route has the same skeleton: check the method, count the request,
 * read and validate the body, run the handler under a deadline, merge the
 * headers and write one log line. Building it once here means a route file
 * holds only what makes that route different.
 */

/**
 * Extra time after the deadline before the factory gives up.
 *
 * The deadline signal aborts the work at `ROUTE_TIMEOUT_MS`, so a handler
 * that passes it to its provider can still write its Basic-mode fallback.
 * The grace period only expires when the handler ignores the signal.
 */
const DEADLINE_GRACE_MS = 2_000;

export interface RouteContext {
  readonly request: Request;
  /** Aborted when the route's budget ends; pass it to provider calls. */
  readonly signal: AbortSignal;
  /** Write the one log line, with the provider failure kind if there was one. */
  complete(providerError?: ProviderErrorKind): void;
  /** Leave the log line to the response stream, which finishes later. */
  deferLog(): void;
}

interface RouteOptions<TSchema extends z.ZodTypeAny> {
  /** Used for the rate limit bucket and the log line. */
  readonly name: string;
  readonly schema: TSchema;
  readonly handler: (body: z.infer<TSchema>, context: RouteContext) => Response | Promise<Response>;
}

interface GetRouteOptions {
  readonly name: string;
  readonly handler: (context: RouteContext) => Response | Promise<Response>;
}

/** Bound the handler by the route budget and abort its provider call in time. */
async function withinBudget<T>(work: Promise<T>, deadline: AbortController): Promise<T> {
  const timer = setTimeout(() => deadline.abort(), ROUTE_TIMEOUT_MS);
  try {
    return await withTimeout(work, ROUTE_TIMEOUT_MS + DEADLINE_GRACE_MS);
  } finally {
    clearTimeout(timer);
  }
}

/** Add the rate limit headers and the cache directive to any response. */
function mergeHeaders(response: Response, headers: Record<string, string>): void {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  response.headers.set('Cache-Control', NO_STORE);
}

// long-function: one pass over the inputs; splitting it would only pass the same state between more functions.
async function runRoute(
  request: Request,
  name: string,
  method: 'GET' | 'POST',
  execute: (context: RouteContext) => Promise<Response>,
): Promise<Response> {
  const startedAt = Date.now();
  const deadline = new AbortController();
  let status = 200;
  let deferred = false;
  let logged = false;
  let rateHeaders: Record<string, string> = {};

  const complete = (providerError?: ProviderErrorKind) => {
    if (logged) return;
    logged = true;
    logRequest(name, status, Date.now() - startedAt, request, providerError);
  };

  const context: RouteContext = {
    request,
    signal: deadline.signal,
    complete,
    deferLog: () => {
      deferred = true;
    },
  };

  try {
    if (request.method !== method) {
      status = 405;
      const response = jsonResponse({ error: 'Method not allowed.' }, { status });
      response.headers.set('Allow', method);
      return response;
    }

    const rate = await enforceRateLimit(request, name);
    rateHeaders = rate.headers;

    const response = await withinBudget(execute(context), deadline);
    status = response.status;
    mergeHeaders(response, rateHeaders);
    return response;
  } catch (error) {
    // A failed handler is logged now, even if it had asked to defer.
    deferred = false;
    const response = errorResponse(error);
    status = response.status;
    mergeHeaders(response, rateHeaders);
    return response;
  } finally {
    if (!deferred) complete();
  }
}

/**
 * Wrap a POST route with the standard guards.
 *
 * The handler receives the validated body and a context with the deadline
 * signal and the log hook. A streaming handler calls `deferLog()` and then
 * `complete()` when its stream ends, so there is still exactly one line.
 *
 * @param options the route name, its body schema and its handler
 * @returns the POST handler Next.js calls
 */
export function createRoute<TSchema extends z.ZodTypeAny>(
  options: RouteOptions<TSchema>,
): (request: Request) => Promise<Response> {
  return (request) =>
    runRoute(request, options.name, 'POST', async (context) => {
      const body = await readJsonBody(request, options.schema);
      return options.handler(body, context);
    });
}

/**
 * Wrap a GET route with the same guards, minus the body.
 *
 * @param options the route name and its handler
 * @returns the GET handler Next.js calls
 */
export function createGetRoute(options: GetRouteOptions): (request: Request) => Promise<Response> {
  return (request) =>
    runRoute(request, options.name, 'GET', (context) => Promise.resolve(options.handler(context)));
}
