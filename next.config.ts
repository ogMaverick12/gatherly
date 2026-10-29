import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * Security headers that are safe to declare statically.
 *
 * The Content-Security-Policy is intentionally NOT declared here: it needs a
 * per-request nonce, so it is issued by `middleware.ts` instead. Keeping the two
 * sources disjoint avoids duplicate/conflicting headers.
 */
const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // These pages are dynamic because the CSP nonce is per request. Next would
  // otherwise stream metadata after the shell, where Lighthouse cannot see it,
  // so block metadata for every user agent and keep it in <head>.
  htmlLimitedBots: /.*/,

  // The repository sits inside a larger workspace; pin the tracing root so
  // Next.js does not pick up an unrelated lockfile further up.
  outputFileTracingRoot: path.join(process.cwd()),
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // The service worker itself must never be cached by the HTTP cache,
        // otherwise clients can be pinned to an old shell.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ];
  },
};

export default nextConfig;
