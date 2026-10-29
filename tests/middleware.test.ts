import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { config, middleware } from '@/middleware';

/** Run the middleware for a document path and return its response. */
function run(path = '/'): Response {
  return middleware(new NextRequest(`https://gatherly.example${path}`));
}

/** The nonce carried inside a Content-Security-Policy value. */
function nonceFrom(policy: string): string {
  const match = /'nonce-([^']+)'/.exec(policy);
  if (!match?.[1]) throw new Error(`No nonce in policy: ${policy}`);
  return match[1];
}

/** The policy header on a response, or a useful failure. */
function policyOf(response: Response): string {
  const policy = response.headers.get('Content-Security-Policy');
  if (!policy) throw new Error('The middleware did not set a Content-Security-Policy header.');
  return policy;
}

/** The nonce carried by script-src, which is the one the page's scripts must use. */
function scriptNonce(policy: string): string {
  const directive = policy.split(';').find((part) => part.trim().startsWith('script-src'));
  if (!directive) throw new Error('The policy has no script-src directive.');
  return nonceFrom(directive);
}

describe('the CSP middleware', () => {
  it('sets a policy with a different nonce on every request', () => {
    const first = policyOf(run());
    const second = policyOf(run());

    expect(first).toContain("default-src 'self'");
    expect(nonceFrom(first)).not.toBe(nonceFrom(second));
  });

  it('passes the same nonce to the page request and to script-src', () => {
    const response = run();
    const policy = policyOf(response);

    expect(policy).toContain(`'nonce-${scriptNonce(policy)}'`);
    expect(response.headers.get('x-middleware-request-x-nonce')).toBe(scriptNonce(policy));
  });

  it('keeps the locked-down directives and never allows unsafe-eval', () => {
    const policy = policyOf(run());

    expect(policy).toContain("object-src 'none'");
    expect(policy).toContain("base-uri 'self'");
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("form-action 'self'");
    expect(policy).not.toContain("'unsafe-eval'");
  });
});

describe('the middleware matcher', () => {
  const [rule] = config.matcher;
  if (!rule || typeof rule === 'string') {
    throw new Error('The middleware config must use a matcher rule object.');
  }
  const pattern = new RegExp(`^${rule.source}$`);

  it.each(['/api/chat', '/_next/static/chunk.js', '/sw.js', '/icons/icon.svg'])(
    'excludes %s',
    (path) => {
      expect(pattern.test(path)).toBe(false);
    },
  );

  it.each(['/', '/intake', '/plan', '/does-not-exist'])('matches %s', (path) => {
    expect(pattern.test(path)).toBe(true);
  });

  it('skips router and purpose prefetches', () => {
    expect(rule.missing).toEqual(
      expect.arrayContaining([
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ]),
    );
  });
});
