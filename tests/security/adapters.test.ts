import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as GenAiModule from '@google/genai';
import { ApiError } from '@google/genai';
import { GeminiProvider } from '@/lib/ai/gemini';
import { OpenRouterProvider } from '@/lib/ai/openrouter';
import { ProviderError, type GenerationRequest } from '@/lib/ai/provider';

const REQUEST: GenerationRequest = {
  intent: 'chat',
  systemPrompt: 'system',
  userText: 'hello',
  planSummary: 'summary',
  basicAnswer: 'basic',
};

const generateContent = vi.fn();
const generateContentStream = vi.fn();

vi.mock('@google/genai', async () => {
  const actual = await vi.importActual<typeof GenAiModule>('@google/genai');
  return {
    ...actual,
    GoogleGenAI: class {
      models = { generateContent, generateContentStream };
    },
  };
});

/** Every text chunk of a stream, in the order the provider sent it. */
async function collect(stream: AsyncIterable<string>): Promise<string[]> {
  const chunks: string[] = [];
  for await (const chunk of stream) chunks.push(chunk);
  return chunks;
}

/** A response body that arrives in the given pieces, split wherever asked. */
function streamedBody(pieces: readonly string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const piece of pieces) controller.enqueue(encoder.encode(piece));
      controller.close();
    },
  });
}

afterEach(() => {
  generateContent.mockReset();
  generateContentStream.mockReset();
  vi.unstubAllGlobals();
});

describe('the Gemini adapter', () => {
  it('returns the answer the model gave', async () => {
    generateContent.mockResolvedValue({ text: '  A calm answer.  ' });
    const provider = new GeminiProvider('key', 'gemini-2.0-flash');

    const result = await provider.generate(REQUEST);

    expect(result.mode).toBe('provider');
    expect(result.provider).toBe('gemini');
    expect(result.content).toBe('A calm answer.');
    expect(generateContent).toHaveBeenCalledOnce();
  });

  it('asks for a JSON answer when the caller wants one', async () => {
    generateContent.mockResolvedValue({ text: '{}' });
    const provider = new GeminiProvider('key', 'gemini-2.0-flash');

    await provider.generate({ ...REQUEST, responseFormat: 'json' });

    const call = generateContent.mock.calls[0]?.[0] as {
      config: { responseMimeType?: string; systemInstruction: { parts: { text: string }[] } };
    };
    expect(call.config.responseMimeType).toBe('application/json');
    expect(call.config.systemInstruction.parts[0]?.text).toBe('system');
  });

  it('asks for the lowest thinking level and room for the answer', async () => {
    generateContent.mockResolvedValue({ text: 'ok' });
    const provider = new GeminiProvider('key', 'gemini-3.6-flash');

    await provider.generate(REQUEST);

    const call = generateContent.mock.calls[0]?.[0] as {
      config: { thinkingConfig?: unknown; maxOutputTokens?: number };
    };
    expect(call.config.thinkingConfig).toEqual({ thinkingLevel: 'MINIMAL' });
    expect(call.config.maxOutputTokens).toBe(2048);
  });

  it('keeps the user text inside the delimited data block', async () => {
    generateContent.mockResolvedValue({ text: 'ok' });
    const provider = new GeminiProvider('key', 'gemini-2.0-flash');

    await provider.generate(REQUEST);

    const call = generateContent.mock.calls[0]?.[0] as {
      contents: { parts: { text: string }[] }[];
    };
    expect(call.contents[0]?.parts[0]?.text).toContain('<user_input>');
  });

  it('refuses an empty answer', async () => {
    generateContent.mockResolvedValue({ text: '   ' });
    const provider = new GeminiProvider('key', 'gemini-3.6-flash');

    await expect(provider.generate(REQUEST)).rejects.toMatchObject({
      name: 'ProviderError',
      kind: 'bad_output',
      retryable: false,
    });
  });

  it('marks a rate limit as retryable', async () => {
    generateContent.mockRejectedValue(new ApiError({ message: 'rate limited', status: 429 }));
    const provider = new GeminiProvider('key', 'gemini-3.6-flash');

    await expect(provider.generate(REQUEST)).rejects.toMatchObject({ retryable: true });
  });

  it('marks a bad request as not retryable', async () => {
    generateContent.mockRejectedValue(new ApiError({ message: 'invalid argument', status: 400 }));
    const provider = new GeminiProvider('key', 'gemini-3.6-flash');

    await expect(provider.generate(REQUEST)).rejects.toMatchObject({ retryable: false });
  });

  it('streams the chunks the model sent', async () => {
    generateContentStream.mockResolvedValue(
      (async function* () {
        yield { text: 'One. ' };
        yield { text: '' };
        yield { text: 'Two.' };
      })(),
    );
    const provider = new GeminiProvider('key', 'gemini-3.6-flash');

    await expect(collect(provider.stream(REQUEST))).resolves.toEqual(['One. ', 'Two.']);
  });

  it('refuses a stream that never produced text', async () => {
    generateContentStream.mockResolvedValue(
      (async function* () {
        yield { text: '' };
      })(),
    );
    const provider = new GeminiProvider('key', 'gemini-3.6-flash');

    await expect(collect(provider.stream(REQUEST))).rejects.toMatchObject({
      kind: 'bad_output',
    });
  });

  it('passes the caller signal to the streaming call', async () => {
    generateContentStream.mockResolvedValue(
      (async function* () {
        yield { text: 'ok' };
      })(),
    );
    const controller = new AbortController();
    const provider = new GeminiProvider('key', 'gemini-3.6-flash');

    await collect(provider.stream({ ...REQUEST, signal: controller.signal }));

    const call = generateContentStream.mock.calls[0]?.[0] as {
      config: { abortSignal?: AbortSignal };
    };
    expect(call.config.abortSignal?.aborted).toBe(false);
    controller.abort();
    expect(call.config.abortSignal?.aborted).toBe(true);
  });
});

describe('the OpenRouter adapter', () => {
  it('returns the answer the model gave', async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(JSON.stringify({ choices: [{ message: { content: ' A calm answer. ' } }] }), {
          status: 200,
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const provider = new OpenRouterProvider('key', 'model');

    const result = await provider.generate(REQUEST);

    expect(result.provider).toBe('openrouter');
    expect(result.content).toBe('A calm answer.');
    const init = fetchMock.mock.calls[0]?.[1];
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.['Authorization']).toBe('Bearer key');
  });

  it('asks for a JSON answer when the caller wants one', async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(JSON.stringify({ choices: [{ message: { content: '{}' } }] }), {
          status: 200,
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const provider = new OpenRouterProvider('key', 'model');

    await provider.generate({ ...REQUEST, responseFormat: 'json' });

    const init = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body)).response_format).toEqual({ type: 'json_object' });
  });

  it('marks a rate limit as retryable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('slow down', { status: 429 })),
    );
    const provider = new OpenRouterProvider('key', 'model');

    await expect(provider.generate(REQUEST)).rejects.toMatchObject({ retryable: true });
  });

  it('marks a server failure as retryable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('oops', { status: 503 })),
    );
    const provider = new OpenRouterProvider('key', 'model');

    await expect(provider.generate(REQUEST)).rejects.toMatchObject({ retryable: true });
  });

  it('does not retry a bad request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('nope', { status: 400 })),
    );
    const provider = new OpenRouterProvider('key', 'model');

    await expect(provider.generate(REQUEST)).rejects.toMatchObject({ retryable: false });
  });

  it('refuses an empty answer', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ choices: [] }), { status: 200 })),
    );
    const provider = new OpenRouterProvider('key', 'model');

    await expect(provider.generate(REQUEST)).rejects.toBeInstanceOf(ProviderError);
  });

  it('marks a network failure as retryable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('fetch failed');
      }),
    );
    const provider = new OpenRouterProvider('key', 'model');

    await expect(provider.generate(REQUEST)).rejects.toMatchObject({ retryable: true });
  });

  it('reads the stream through comments, [DONE] and a frame split across chunks', async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(
          streamedBody([
            ': keep-alive\n\n',
            'data: {"choices":[{"delta":{"content":"One. "}}]}\n\n',
            'data: {"choices":[{"delta":{"conte',
            'nt":"Two."}}]}\n\n',
            'data: [DONE]\n\n',
            'data: {"choices":[{"delta":{"content":"ignored"}}]}\n\n',
          ]),
          { status: 200, headers: { 'Content-Type': 'text/event-stream' } },
        ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const provider = new OpenRouterProvider('key', 'model');

    const chunks = await collect(provider.stream(REQUEST));

    expect(chunks).toEqual(['One. ', 'Two.']);
    const init = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(init?.body)).stream).toBe(true);
  });

  it('refuses a stream with no usable chunk', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(streamedBody(['data: {"error":"nope"}\n\n', 'data: [DONE]\n\n']), {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream' },
          }),
      ),
    );
    const provider = new OpenRouterProvider('key', 'model');

    await expect(collect(provider.stream(REQUEST))).rejects.toMatchObject({
      kind: 'bad_output',
    });
  });
});
