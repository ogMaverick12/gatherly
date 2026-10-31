import { describe, expect, it, vi } from 'vitest';
import { providerAttempt } from '@/lib/ai/chat-attempt';
import { ProviderError, type GenerationRequest, type Provider } from '@/lib/ai/provider';

/**
 * One attempt at a streamed provider answer.
 *
 * The single retry exists for the same reason the non-streaming path has one:
 * a 429 or a 5xx is worth trying again, and it is only free while no text has
 * been sent. Anything else must fall back to Basic mode without a second call.
 */

const REQUEST: GenerationRequest = {
  intent: 'chat',
  systemPrompt: 'system',
  userText: 'How much is food?',
  planSummary: 'summary',
  basicAnswer: 'Food is 28% of the budget.',
};

const noSleep = vi.fn(async () => undefined);

function collector() {
  const sent: string[] = [];
  const write = (event: string, data: unknown) => {
    const frame = data as { text?: string; message?: string };
    sent.push(frame.text ?? frame.message ?? '');
    return event !== 'closed';
  };
  return { sent, write };
}

function providerThat(failing: () => void, answer = 'Recovered.'): Provider {
  return {
    id: 'gemini',
    generate: vi.fn(),
    stream: () =>
      (async function* () {
        failing();
        yield answer;
      })(),
  };
}

describe('providerAttempt', () => {
  it('retries a transient failure once before any text is sent', async () => {
    let calls = 0;
    const provider: Provider = {
      id: 'gemini',
      generate: vi.fn(),
      stream: () =>
        (async function* () {
          calls += 1;
          if (calls === 1) throw new ProviderError('busy', true, 'server');
          yield 'Recovered.';
        })(),
    };
    const { sent, write } = collector();

    const attempt = await providerAttempt(provider, REQUEST, write, noSleep);

    expect(calls).toBe(2);
    expect(noSleep).toHaveBeenCalledTimes(1);
    expect(attempt.fallback).toBe(false);
    expect(attempt.kind).toBeNull();
    expect(sent.join('')).toBe('Recovered.');
  });

  it('does not retry a failure that is not transient', async () => {
    const failing = (): never => {
      throw new ProviderError('no such model', false, 'model_not_found');
    };
    const provider = providerThat(failing);
    const stream = vi.spyOn(provider, 'stream');
    const { write } = collector();

    const attempt = await providerAttempt(provider, REQUEST, write, noSleep);

    expect(stream).toHaveBeenCalledTimes(1);
    expect(noSleep).not.toHaveBeenCalled();
    expect(attempt.fallback).toBe(true);
    expect(attempt.kind).toBe('model_not_found');
  });

  it('gives up after one retry and reports the second failure', async () => {
    let calls = 0;
    const provider: Provider = {
      id: 'gemini',
      generate: vi.fn(),
      stream: () =>
        (async function* () {
          calls += 1;
          throw new ProviderError('still busy', true, 'rate_limited');
        })(),
    };
    const { write } = collector();

    const attempt = await providerAttempt(provider, REQUEST, write, noSleep);

    expect(calls).toBe(2);
    expect(attempt.fallback).toBe(true);
    expect(attempt.kind).toBe('rate_limited');
  });
});
