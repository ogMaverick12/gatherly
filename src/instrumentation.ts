/**
 * Startup hook.
 *
 * Next.js calls `register()` once when the server starts, so the
 * rate-limit warning is emitted at startup instead of on the first request.
 * The edge runtime has no rate limiter, so the check is Node-only.
 */
export async function register(): Promise<void> {
  if (process.env['NEXT_RUNTIME'] !== 'nodejs') return;

  const { warnWhenRateLimitIsPerInstance } = await import('@/lib/security/rate-limit');
  warnWhenRateLimitIsPerInstance();
}
