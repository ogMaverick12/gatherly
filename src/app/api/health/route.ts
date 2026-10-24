import { selectProvider } from '@/lib/ai';
import { enforceRateLimit, errorResponse, jsonResponse, logRequest } from '@/lib/security/guards';
import { rateLimitMode } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';
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
export async function GET(request: Request): Promise<Response> {
  const startedAt = Date.now();
  let status = 200;
  try {
    const rate = await enforceRateLimit(request, 'health');
    const selection = selectProvider();

    return jsonResponse(
      { ok: true, mode: selection.provider.id, rateLimit: rateLimitMode() },
      { headers: rate.headers },
    );
  } catch (error) {
    const response = errorResponse(error);
    status = response.status;
    return response;
  } finally {
    logRequest('health', status, Date.now() - startedAt, request);
  }
}
