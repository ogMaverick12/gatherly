import { describe, expect, it, vi } from 'vitest';
import { chatEventStream } from '@/lib/ai/chat-stream';
import type { GenerationRequest, Provider } from '@/lib/ai/provider';

/**
 * The chat event stream on its own, without the route around it.
 *
 * These are the cases the route-level tests cannot see: a provider that
 * answers with nothing, and a browser that closes before the first chunk.
 */

const REQUEST: GenerationRequest = {
  intent: 'chat',
  systemPrompt: 'system',
  userText: 'How much is food?',
  planSummary: 'summary',
  basicAnswer: 'Food is 28% of the budget. The caterer is unbooked.',
};

interface Frame {
  readonly name: string;
  readonly data: Record<string, unknown>;
}

function parseFrames(text: string): Frame[] {
  return text
    .split('\n\n')
    .filter((block) => block.trim().length > 0)
    .map((block) => {
      const lines = block.split('\n');
      const name =
        lines
          .find((line) => line.startsWith('event:'))
          ?.slice(6)
          .trim() ?? '';
      const raw =
        lines
          .find((line) => line.startsWith('data:'))
          ?.slice(5)
          .trim() ?? '{}';
      return { name, data: JSON.parse(raw) as Record<string, unknown> };
    });
}

function providerThat(stream: Provider['stream']): Provider {
  return { id: 'gemini', generate: vi.fn(), stream };
}

describe('the chat event stream', () => {
  it('falls back to Basic mode when the provider streams no text at all', async () => {
    const stream = chatEventStream({
      provider: providerThat(async function* () {
        // A finished stream with no chunk is an unusable answer, not an outage.
      }),
      live: true,
      request: REQUEST,
      basicAnswer: REQUEST.basicAnswer,
    });

    const frames = parseFrames(await new Response(stream).text());

    expect(frames[0]?.data['live']).toBe(true);
    expect(frames[1]?.name).toBe('mode');
    expect(frames[1]?.data['live']).toBe(false);
    expect(frames.at(-1)?.data['mode']).toBe('basic');
    expect(frames.at(-1)?.data['providerError']).toBe('bad_output');
  });

  it('finishes and reports once when the client leaves before the first chunk', async () => {
    const client = new AbortController();
    const onComplete = vi.fn();
    let upstreamStopped = false;

    const stream = chatEventStream({
      provider: providerThat((request) =>
        (async function* () {
          await new Promise<void>((resolve) => {
            request.signal?.addEventListener(
              'abort',
              () => {
                upstreamStopped = true;
                resolve();
              },
              { once: true },
            );
          });
          throw new DOMException('Aborted', 'AbortError');
        })(),
      ),
      live: true,
      request: REQUEST,
      basicAnswer: REQUEST.basicAnswer,
      clientSignal: client.signal,
      onComplete,
    });

    const reader = stream.getReader();
    await reader.read();
    client.abort();
    for (;;) {
      const { done } = await reader.read();
      if (done) break;
    }

    expect(upstreamStopped).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith('network');
  });

  it('calls the completion hook with null for a Basic-mode answer', async () => {
    const onComplete = vi.fn();

    const stream = chatEventStream({
      provider: providerThat(async function* () {
        yield 'never used';
      }),
      live: false,
      request: REQUEST,
      basicAnswer: REQUEST.basicAnswer,
      onComplete,
    });

    const frames = parseFrames(await new Response(stream).text());

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(null);
    expect(frames.at(-1)?.data['mode']).toBe('basic');
    expect(frames.at(-1)?.data['providerError']).toBeNull();
  });
});
