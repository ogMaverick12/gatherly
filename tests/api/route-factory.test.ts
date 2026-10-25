import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { jsonResponse } from '@/lib/security/http';
import { InMemoryRateLimiter, setRateLimiter } from '@/lib/security/rate-limit';
import { createGetRoute, createRoute } from '@/lib/security/route';

/**
 * The route factory.
 *
 * Every route used to repeat the same guard sequence, so the order was only
 * as good as the last copy. These tests hold the order itself: the rate
 * limit before the body, the size cap before the parser, and one log line
 * for a streamed answer that finishes long after the handler returns.
 */

const Schema = z.object({ name: z.string().min(1) });

function request(body: unknown, method = 'POST'): Request {
  return new Request('https://gatherly.test/api/test', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

function handlerFor(spy = vi.fn(), name = 'test') {
  return createRoute({
    name,
    schema: Schema,
    handler: async (body) => {
      spy(body);
      return jsonResponse({ name: body.name });
    },
  });
}

beforeEach(() => {
  setRateLimiter(new InMemoryRateLimiter(100, 100));
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  setRateLimiter(null);
  vi.restoreAllMocks();
});

describe('the route factory', () => {
  it('checks the rate limit before it reads the body', async () => {
    setRateLimiter(new InMemoryRateLimiter(0, 60));
    const handlerBody = vi.fn();
    const handler = handlerFor(handlerBody);

    // Reading this body would answer 413; only the rate limit can explain a
    // 429, so the status itself proves which guard ran first.
    const response = await handler(request('x'.repeat(20_000)));

    expect(response.status).toBe(429);
    expect(handlerBody).not.toHaveBeenCalled();
    expect(response.headers.get('Retry-After')).toBeTruthy();
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });

  it('rejects an oversize body with 413 before it tries to parse it', async () => {
    const handler = handlerFor();

    // Not JSON at all: only the size cap can produce this status.
    const response = await handler(request('x'.repeat(20_000)));

    expect(response.status).toBe(413);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });

  it('rejects a non-POST method with 405 and says what is allowed', async () => {
    const handler = handlerFor();

    const response = await handler(request(null, 'GET'));

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('POST');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });

  it('rejects a body the schema does not accept', async () => {
    const handler = handlerFor();

    const response = await handler(request({ name: '' }));

    expect(response.status).toBe(400);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });

  it('hands the validated body to the handler and merges the headers', async () => {
    const spy = vi.fn();
    const handler = handlerFor(spy);

    const response = await handler(request({ name: 'Ada' }));

    expect(spy).toHaveBeenCalledWith({ name: 'Ada' });
    await expect(response.json()).resolves.toEqual({ name: 'Ada' });
    expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });

  it('hides an unexpected handler error behind a 500 that is still uncacheable', async () => {
    const handler = createRoute({
      name: 'test',
      schema: Schema,
      handler: () => {
        throw new Error('internal detail');
      },
    });

    const response = await handler(request({ name: 'Ada' }));
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(body.error).not.toContain('internal detail');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });

  it('returns a streaming response untouched and logs it when the stream ends', async () => {
    const warn = vi.mocked(console.warn);
    let finish: (() => void) | undefined;

    const handler = createRoute({
      name: 'stream',
      schema: Schema,
      handler: (_body, context) => {
        context.deferLog();
        finish = () => context.complete('server');
        return new Response('event: delta\ndata: {}\n\n', {
          headers: { 'Content-Type': 'text/event-stream' },
        });
      },
    });

    const response = await handler(request({ name: 'Ada' }));

    await expect(response.text()).resolves.toContain('event: delta');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
    // Nothing is logged until the stream says it is done.
    expect(warn).not.toHaveBeenCalled();

    finish?.();

    expect(warn).toHaveBeenCalledTimes(1);
    const line = JSON.parse(String(warn.mock.calls[0]?.[0])) as Record<string, unknown>;
    expect(line['route']).toBe('stream');
    expect(line['providerError']).toBe('server');
    expect(String(warn.mock.calls[0]?.[0])).not.toContain('Ada');
  });

  it('writes exactly one log line for an ordinary request', async () => {
    const warn = vi.mocked(console.warn);
    const handler = handlerFor();

    await handler(request({ name: 'Ada' }));

    expect(warn).toHaveBeenCalledTimes(1);
    const line = JSON.parse(String(warn.mock.calls[0]?.[0])) as Record<string, unknown>;
    expect(line['status']).toBe(200);
    expect(line['correlationId']).toEqual(expect.any(String));
  });
});

describe('the GET route factory', () => {
  it('answers a GET and refuses a POST', async () => {
    const handler = createGetRoute({ name: 'health', handler: () => jsonResponse({ ok: true }) });

    const ok = await handler(request(null, 'GET'));
    expect(ok.status).toBe(200);
    expect(ok.headers.get('Cache-Control')).toContain('no-store');

    const refused = await handler(request({}, 'POST'));
    expect(refused.status).toBe(405);
    expect(refused.headers.get('Allow')).toBe('GET');
  });
});
