import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import {
  errorResponse,
  HttpError,
  jsonResponse,
  readJsonBody,
  withGuards,
} from '@/lib/security/guards';
import { InMemoryRateLimiter, setRateLimiter } from '@/lib/security/rate-limit';

const Schema = z.object({ name: z.string().min(1).max(20) });

function jsonRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://gatherly.example/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

describe('jsonResponse', () => {
  it('marks the response as uncacheable', () => {
    const response = jsonResponse({ ok: true });
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});

describe('errorResponse', () => {
  it('uses the status of an HttpError', async () => {
    const response = errorResponse(new HttpError(400, 'Bad input'));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Bad input',
      details: null,
    });
  });

  it('hides an unexpected error behind a generic message', async () => {
    const response = errorResponse(new Error('secret internal detail'));
    expect(response.status).toBe(500);
    const body = (await response.json()) as { error: string };
    expect(body.error).not.toContain('secret internal detail');
  });
});

describe('readJsonBody', () => {
  it('parses and validates a body', async () => {
    const parsed = await readJsonBody(jsonRequest({ name: 'ok' }), Schema);
    expect(parsed).toEqual({ name: 'ok' });
  });

  it('rejects an empty body', async () => {
    await expect(readJsonBody(jsonRequest(''), Schema)).rejects.toThrow(HttpError);
  });

  it('rejects a body that is not JSON', async () => {
    await expect(readJsonBody(jsonRequest('{not json'), Schema)).rejects.toThrow(
      'That body is not valid JSON.',
    );
  });

  it('rejects a body that does not match the schema', async () => {
    await expect(readJsonBody(jsonRequest({ name: '' }), Schema)).rejects.toThrow(
      'Please check the values you sent.',
    );
  });

  it('rejects a body that is too large', async () => {
    const request = jsonRequest({ name: 'x'.repeat(100) });
    await expect(readJsonBody(request, Schema, 10)).rejects.toThrow('That request is too large.');
  });

  it('rejects a body that declares a length over the cap', async () => {
    const request = jsonRequest({ name: 'ok' }, { 'content-length': '999999' });
    await expect(readJsonBody(request, Schema, 10)).rejects.toThrow('That request is too large.');
  });
});

describe('withGuards', () => {
  it('rejects a non-POST method', async () => {
    const handler = withGuards('test', Schema, async () => jsonResponse({ ok: true }));
    const response = await handler(
      new Request('https://gatherly.example/api/test', { method: 'GET' }),
    );
    expect(response.status).toBe(405);
  });

  it('hands a validated body to the handler', async () => {
    const handler = withGuards('test', Schema, async (body) => jsonResponse({ name: body.name }));
    const response = await handler(jsonRequest({ name: 'Ada' }));
    await expect(response.json()).resolves.toEqual({ name: 'Ada' });
  });

  it('answers a rate-limited request with 429', async () => {
    setRateLimiter(new InMemoryRateLimiter(1, 1));
    try {
      const handler = withGuards('test', Schema, async () => jsonResponse({ ok: true }));
      await handler(jsonRequest({ name: 'ok' }));
      const response = await handler(jsonRequest({ name: 'ok' }));
      expect(response.status).toBe(429);
    } finally {
      setRateLimiter(null);
    }
  });

  it('adds the rate limit headers to the response', async () => {
    const handler = withGuards('test', Schema, async () => jsonResponse({ ok: true }));
    const response = await handler(jsonRequest({ name: 'ok' }));
    expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy();
    expect(response.headers.get('X-RateLimit-Remaining')).toBeTruthy();
  });
});

describe('InMemoryRateLimiter', () => {
  it('allows requests up to the capacity', async () => {
    const limiter = new InMemoryRateLimiter(3, 3);
    for (let index = 0; index < 3; index += 1) {
      await expect(limiter.check('key')).resolves.toMatchObject({ allowed: true });
    }
    await expect(limiter.check('key')).resolves.toMatchObject({ allowed: false });
  });

  it('keeps separate buckets per key', async () => {
    const limiter = new InMemoryRateLimiter(1, 1);
    await limiter.check('a');
    await expect(limiter.check('b')).resolves.toMatchObject({ allowed: true });
  });

  it('refills over time', async () => {
    let now = 0;
    const limiter = new InMemoryRateLimiter(1, 60, () => now);
    await limiter.check('key');
    await expect(limiter.check('key')).resolves.toMatchObject({ allowed: false });
    now += 2000;
    await expect(limiter.check('key')).resolves.toMatchObject({ allowed: true });
  });

  it('reports how long to wait', async () => {
    const limiter = new InMemoryRateLimiter(1, 60);
    await limiter.check('key');
    const result = await limiter.check('key');
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });
});

describe('the rate limiter guard', () => {
  it('uses the process-wide limiter', async () => {
    const seen: string[] = [];
    setRateLimiter({
      kind: 'memory',
      check: async (key) => {
        seen.push(key);
        return { allowed: true, remaining: 9, limit: 10, retryAfterMs: 0 };
      },
    });
    try {
      const handler = withGuards('chat', Schema, async () => jsonResponse({ ok: true }));
      const response = await handler(jsonRequest({ name: 'ok' }));
      expect(response.status).toBe(200);
      expect(seen[0]).toContain('chat:');
    } finally {
      setRateLimiter(null);
    }
  });
});
