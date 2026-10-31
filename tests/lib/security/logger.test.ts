import { afterEach, describe, expect, it, vi } from 'vitest';
import { logWarn } from '@/lib/security/logger';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the security logger', () => {
  it('writes one stable JSON line', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    logWarn({ app: 'gatherly', event: 'rate_limit_fail_open' });
    expect(warn).toHaveBeenCalledWith('{"app":"gatherly","event":"rate_limit_fail_open"}');
  });

  it('redacts credentials and user text at any depth', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    logWarn({
      app: 'gatherly',
      apiKey: 'secret',
      nested: { token: 'secret', count: 2, items: [{ prompt: 'private' }] },
    });
    expect(JSON.parse(String(warn.mock.calls[0]?.[0]))).toEqual({
      app: 'gatherly',
      apiKey: '[redacted]',
      nested: { token: '[redacted]', count: 2, items: [{ prompt: '[redacted]' }] },
    });
  });
});
