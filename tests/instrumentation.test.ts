import { afterEach, describe, expect, it, vi } from 'vitest';

const { register } = await import('@/instrumentation');

/**
 * The startup hook.
 *
 * The hook runs once when the server starts, so the rate-limit warning is
 * emitted at startup and only in the Node runtime.
 */
describe('the startup hook', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('warns once in production without the shared store', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'nodejs');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await register();

    expect(warn).toHaveBeenCalledTimes(1);
  });

  it('does nothing in the edge runtime', async () => {
    vi.stubEnv('NEXT_RUNTIME', 'edge');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
    vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await register();

    expect(warn).not.toHaveBeenCalled();
  });
});
