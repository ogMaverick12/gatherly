import { selectProvider } from '@/lib/ai';
import { jsonResponse } from '@/lib/security/http';
import { rateLimitMode } from '@/lib/security/rate-limit';
import { createGetRoute } from '@/lib/security/route';

/** Node.js runtime: the rate-limit mode reads server-only env vars. */
export const runtime = 'nodejs';
/** Report fresh state on every call, never a cached snapshot. */
export const dynamic = 'force-dynamic';

/**
 * GET /api/health
 *
 * A read-only report of how the deployment is configured:
 *   ok        - the app is up
 *   mode      - the provider that actually answers ('basic', 'gemini', 'openrouter')
 *   rateLimit - 'shared' when the Upstash store is configured, 'per-instance' otherwise
 *
 * It reports state and nothing else: no keys, no request data, no plan.
 */
export const GET = createGetRoute({
  name: 'health',
  handler: () =>
    jsonResponse({
      ok: true,
      mode: selectProvider().provider.id,
      rateLimit: rateLimitMode(),
    }),
});
