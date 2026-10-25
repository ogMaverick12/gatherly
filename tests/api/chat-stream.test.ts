import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as AiModule from '@/lib/ai';
import type { ApiSnapshot } from '@/lib/api-schema';
import { ProviderError, type GenerationRequest } from '@/lib/ai/provider';
import { computePlanView } from '@/lib/plan-view';
import { createPlan } from '@/lib/plan';
import { TEST_INTAKE } from '../helpers';

/**
 * The streamed chat route.
 *
 * The order of the frames is the contract: the mode badge first, then the
 * answer as it arrives, then one terminal frame. A provider that fails has to
 * fail honestly - Basic mode before the first token, a plain error after it.
 */

const selectProvider = vi.fn();

vi.mock('@/lib/ai', async () => {
  const actual = await vi.importActual<typeof AiModule>('@/lib/ai');
  return { ...actual, selectProvider: (...args: unknown[]) => selectProvider(...args) };
});

vi.mock('@/lib/ai/gemini', () => ({ GeminiProvider: class {} }));
vi.mock('@/lib/ai/openrouter', () => ({ OpenRouterProvider: class {} }));

const { POST: chat } = await import('@/app/api/chat/route');

const snapshot: ApiSnapshot = structuredClone(
  computePlanView(createPlan(TEST_INTAKE, new Date('2026-01-01T00:00:00.000Z'))).snapshot,
) as ApiSnapshot;

let ip = 0;

function request(body: Record<string, unknown>, init: RequestInit = {}): Request {
  ip += 1;
  return new Request('https://gatherly.test/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': `10.1.0.${ip}` },
    body: JSON.stringify({ message: 'How much is food?', planSummary: 'x', snapshot, ...body }),
    ...init,
  });
}

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

function deltaTexts(frames: readonly Frame[]): string[] {
  return frames
    .filter((frame) => frame.name === 'delta')
    .map((frame) => String(frame.data['text']));
}

function liveProvider(stream: (request: GenerationRequest) => AsyncIterable<string>) {
  return {
    provider: { id: 'gemini' as const, generate: vi.fn(), stream: vi.fn(stream) },
    live: true,
    notice: null,
  };
}

beforeEach(() => {
  selectProvider.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the chat stream', () => {
  it('sends the mode before the answer and every chunk in order', async () => {
    selectProvider.mockReturnValue(
      liveProvider(async function* () {
        yield 'One. ';
        yield 'Two. ';
        yield 'Three.';
      }),
    );

    const frames = parseFrames(await (await chat(request({}))).text());

    expect(frames[0]?.name).toBe('mode');
    expect(frames[0]?.data['live']).toBe(true);
    expect(frames[0]?.data['provider']).toBe('gemini');
    expect(frames.at(-1)?.name).toBe('done');
    expect(deltaTexts(frames)).toEqual(['One. ', 'Two. ', 'Three.']);
    expect(frames.at(-1)?.data['mode']).toBe('provider');
  });

  it('streams the Basic answer in more than one delta', async () => {
    selectProvider.mockReturnValue({
      provider: { id: 'basic' as const, generate: vi.fn(), stream: vi.fn() },
      live: false,
      notice: 'GATHERLY_AI_PROVIDER is set to basic, so answers come from Basic mode.',
    });

    const frames = parseFrames(await (await chat(request({}))).text());
    const deltas = deltaTexts(frames);

    expect(frames[0]?.name).toBe('mode');
    expect(frames[0]?.data['live']).toBe(false);
    expect(deltas.length).toBeGreaterThan(1);
    expect(deltas.join('').length).toBeGreaterThan(0);
    expect(frames.at(-1)?.data['mode']).toBe('basic');
  });

  it('falls back to Basic mode when the provider fails before the first chunk', async () => {
    selectProvider.mockReturnValue(
      liveProvider(async function* () {
        throw new ProviderError('secret detail', true, 'network');
      }),
    );

    const text = await (await chat(request({}))).text();
    const frames = parseFrames(text);
    const done = frames.at(-1);

    // The first mode frame was optimistic; a second one corrects the badge.
    expect(frames[0]?.data['live']).toBe(true);
    expect(frames[1]?.name).toBe('mode');
    expect(frames[1]?.data['live']).toBe(false);
    expect(frames[1]?.data['provider']).toBe('basic');
    expect(deltaTexts(frames).length).toBeGreaterThan(0);
    expect(done?.data['mode']).toBe('basic');
    expect(done?.data['providerError']).toBe('network');
    expect(String(done?.data['notices'])).toContain('could not be reached');
    expect(text).not.toContain('secret detail');
  });

  it('reports an error frame after text has already been sent', async () => {
    selectProvider.mockReturnValue(
      liveProvider(async function* () {
        yield 'Part one. ';
        throw new ProviderError('secret detail', false, 'server');
      }),
    );

    const text = await (await chat(request({}))).text();
    const frames = parseFrames(text);
    const error = frames.find((frame) => frame.name === 'error');
    const done = frames.at(-1);

    expect(error).toBeDefined();
    expect(String(error?.data['message'])).toContain('server error');
    expect(String(error?.data['message'])).toContain('stops here');
    expect(deltaTexts(frames)).toEqual(['Part one. ']);
    expect(done?.name).toBe('done');
    expect(done?.data['mode']).toBe('provider');
    expect(done?.data['interrupted']).toBe(true);
    expect(done?.data['providerError']).toBe('server');
    expect(text).not.toContain('secret detail');
  });

  it('cancels the provider call when the client disconnects', async () => {
    let upstreamStopped = false;
    const controller = new AbortController();

    selectProvider.mockReturnValue(
      liveProvider((providerRequest) =>
        (async function* () {
          yield 'First part. ';
          await new Promise<void>((resolve) => {
            const signal = providerRequest.signal;
            if (!signal || signal.aborted) {
              upstreamStopped = true;
              resolve();
              return;
            }
            signal.addEventListener(
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
    );

    const response = await chat(request({}, { signal: controller.signal }));
    const reader = response.body?.getReader();
    expect(reader).toBeDefined();
    if (!reader) return;

    const decoder = new TextDecoder();
    let text = '';
    while (!text.includes('First part.')) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) text += decoder.decode(value, { stream: true });
    }

    expect(text).toContain('event: mode');
    controller.abort();

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) text += decoder.decode(value, { stream: true });
    }

    expect(upstreamStopped).toBe(true);
    expect(text).toContain('event: done');
  });
});
