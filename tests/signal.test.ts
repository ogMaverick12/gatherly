import { describe, expect, it, vi } from 'vitest';
import { combineSignals } from '@/lib/ai/signal';

/**
 * Combining the two reasons a provider call has to stop: the client left, or
 * the route ran out of time. `AbortSignal.any` is not assumed, so the rules are
 * spelled out here.
 */

describe('combineSignals', () => {
  it('returns undefined when there is nothing to watch', () => {
    expect(combineSignals([undefined, undefined])).toBeUndefined();
  });

  it('returns the only signal unchanged', () => {
    const controller = new AbortController();
    expect(combineSignals([undefined, controller.signal])).toBe(controller.signal);
  });

  it('aborts when the first input aborts', () => {
    const deadline = new AbortController();
    const client = new AbortController();
    const combined = combineSignals([deadline.signal, client.signal]);
    const listener = vi.fn();
    combined?.addEventListener('abort', listener);

    client.abort();

    expect(combined?.aborted).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('aborts when the second input aborts', () => {
    const deadline = new AbortController();
    const client = new AbortController();
    const combined = combineSignals([deadline.signal, client.signal]);

    deadline.abort();

    expect(combined?.aborted).toBe(true);
  });

  it('is already aborted when an input already is', () => {
    const client = new AbortController();
    client.abort();

    expect(combineSignals([new AbortController().signal, client.signal])?.aborted).toBe(true);
  });
});
