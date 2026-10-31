import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as GenAiModule from '@google/genai';
import { ApiError } from '@google/genai';
import type { GenerationRequest, ProviderErrorKind } from '@/lib/ai/provider';
import { GeminiProvider } from '@/lib/ai/gemini';
import { OpenRouterProvider } from '@/lib/ai/openrouter';

const generateContent = vi.fn();

vi.mock('@google/genai', async () => {
  const actual = await vi.importActual<typeof GenAiModule>('@google/genai');
  return {
    ...actual,
    GoogleGenAI: class {
      models = { generateContent };
    },
  };
});

const REQUEST: GenerationRequest = {
  intent: 'chat',
  systemPrompt: 'system',
  userText: 'hello',
  planSummary: 'summary',
  basicAnswer: 'basic',
};

const GEMINI_STATUSES: [number, ProviderErrorKind][] = [
  [404, 'model_not_found'],
  [401, 'auth'],
  [403, 'auth'],
  [429, 'rate_limited'],
  [500, 'server'],
  [400, 'bad_output'],
];

const OPENROUTER_STATUSES: [number, ProviderErrorKind][] = [
  [404, 'model_not_found'],
  [401, 'auth'],
  [429, 'rate_limited'],
  [503, 'server'],
  [400, 'bad_output'],
];

function isRetryable(kind: ProviderErrorKind): boolean {
  return kind === 'rate_limited' || kind === 'server' || kind === 'timeout' || kind === 'network';
}

afterEach(() => {
  generateContent.mockReset();
  vi.unstubAllGlobals();
});

describe('the Gemini failure kinds', () => {
  it.each(GEMINI_STATUSES)('maps HTTP %i to %s', async (status, kind) => {
    generateContent.mockRejectedValue(
      new ApiError({ message: 'provider said something secret', status }),
    );

    const error = await new GeminiProvider('key', 'gemini-3.6-flash')
      .generate(REQUEST)
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ kind, retryable: isRetryable(kind) });
    expect(String((error as Error).message)).not.toContain('provider said something secret');
  });

  it('maps a timeout to the timeout kind', async () => {
    generateContent.mockRejectedValue(
      Object.assign(new Error('aborted'), { name: 'TimeoutError' }),
    );

    await expect(
      new GeminiProvider('key', 'gemini-3.6-flash').generate(REQUEST),
    ).rejects.toMatchObject({ kind: 'timeout', retryable: true });
  });

  it('maps an empty answer to bad_output', async () => {
    generateContent.mockResolvedValue({ text: '   ' });

    await expect(
      new GeminiProvider('key', 'gemini-3.6-flash').generate(REQUEST),
    ).rejects.toMatchObject({ kind: 'bad_output', retryable: false });
  });
});

describe('the OpenRouter failure kinds', () => {
  it.each(OPENROUTER_STATUSES)('maps HTTP %i to %s', async (status, kind) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('provider detail', { status })),
    );

    const error = await new OpenRouterProvider('key', 'google/gemini-3.8-flash')
      .generate(REQUEST)
      .catch((caught: unknown) => caught);

    expect(error).toMatchObject({ kind, retryable: isRetryable(kind) });
    expect(String((error as Error).message)).not.toContain('provider detail');
  });

  it('maps a rejected fetch to network', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('connect ECONNREFUSED');
      }),
    );

    await expect(
      new OpenRouterProvider('key', 'google/gemini-3.8-flash').generate(REQUEST),
    ).rejects.toMatchObject({ kind: 'network', retryable: true });
  });

  it('maps an aborted fetch to timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw Object.assign(new Error('aborted'), { name: 'TimeoutError' });
      }),
    );

    await expect(
      new OpenRouterProvider('key', 'google/gemini-3.8-flash').generate(REQUEST),
    ).rejects.toMatchObject({ kind: 'timeout', retryable: true });
  });

  it('maps a non-JSON body to bad_output', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('not json', { status: 200 })),
    );

    await expect(
      new OpenRouterProvider('key', 'google/gemini-3.8-flash').generate(REQUEST),
    ).rejects.toMatchObject({ kind: 'bad_output', retryable: false });
  });

  it('maps an empty answer to bad_output', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ choices: [] }), { status: 200 })),
    );

    await expect(
      new OpenRouterProvider('key', 'google/gemini-3.8-flash').generate(REQUEST),
    ).rejects.toMatchObject({ kind: 'bad_output', retryable: false });
  });
});
