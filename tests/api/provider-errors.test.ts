import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as AiModule from '@/lib/ai';
import { ProviderError, type GenerationResult, type ProviderErrorKind } from '@/lib/ai/provider';
import { makeSnapshot } from '../factories';

/**
 * What the routes say and log when a provider fails.
 *
 * The kind has to reach the person planning the event as its own sentence,
 * and the log may hold the kind but never the provider's message.
 */

const selectProvider = vi.fn();

vi.mock('@/lib/ai', async () => {
  const actual = await vi.importActual<typeof AiModule>('@/lib/ai');
  return { ...actual, selectProvider: (...args: unknown[]) => selectProvider(...args) };
});

vi.mock('@/lib/ai/gemini', () => ({ GeminiProvider: class {} }));
vi.mock('@/lib/ai/openrouter', () => ({ OpenRouterProvider: class {} }));

const { POST: chat } = await import('@/app/api/chat/route');
const { POST: ideas } = await import('@/app/api/ideas/route');
const { POST: parse } = await import('@/app/api/parse/route');

const snapshot = makeSnapshot();

const IDEAS_CONTEXT = {
  guests: 120,
  eventType: 'wedding',
  cityTier: 'tier2',
  currency: 'INR',
  budgetMinor: 10_000_000,
  perGuestMinor: 83_333,
  priorities: ['food'],
  dietary: ['vegetarian'],
  month: 12,
};

/** The sentence each kind must produce, distinct from every other kind. */
const NOTICE_TEXT: Record<ProviderErrorKind, string> = {
  timeout: 'took too long',
  rate_limited: 'busy right now',
  model_not_found: 'model could not be found',
  auth: 'rejected the configured key',
  bad_output: 'answer could not be read',
  server: 'server error',
  network: 'could not be reached',
};

const KINDS = Object.keys(NOTICE_TEXT) as ProviderErrorKind[];

function request(body: unknown): Request {
  return new Request('https://gatherly.test/api/ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-real-ip': '10.0.0.1' },
    body: JSON.stringify(body),
  });
}

function rejecting(kind: ProviderErrorKind) {
  return {
    provider: {
      id: 'gemini' as const,
      generate: vi.fn(async (): Promise<GenerationResult> => {
        throw new ProviderError('provider detail secret', false, kind);
      }),
      // The chat route streams; the failure has to look the same either way.
      stream: vi.fn(async function* (): AsyncIterable<string> {
        throw new ProviderError('provider detail secret', false, kind);
      }),
    },
    live: true,
    notice: null,
  };
}

async function ideasBody() {
  const response = await ideas(request({ planSummary: 'x', context: IDEAS_CONTEXT }));
  expect(response.status).toBe(200);
  return (await response.json()) as {
    mode: string;
    notices: string[];
    providerError: string | null;
  };
}

beforeEach(() => {
  selectProvider.mockReset();
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the failure kind shown to the user', () => {
  it.each(KINDS)('shows the %s notice and keeps the mode badge honest', async (kind) => {
    selectProvider.mockReturnValue(rejecting(kind));

    const body = await ideasBody();

    expect(body.mode).toBe('basic');
    expect(body.providerError).toBe(kind);
    expect(body.notices.join(' ')).toContain(NOTICE_TEXT[kind]);
    expect(body.notices.join(' ')).not.toContain('provider detail secret');
  });

  it('reports unusable JSON as bad_output, not as an unreachable provider', async () => {
    selectProvider.mockReturnValue({
      provider: {
        id: 'gemini' as const,
        generate: vi.fn(async () => ({
          mode: 'provider' as const,
          provider: 'gemini' as const,
          content: 'no json at all',
          notices: [],
        })),
      },
      live: true,
      notice: null,
    });

    const body = await ideasBody();

    expect(body.providerError).toBe('bad_output');
    expect(body.notices.join(' ')).toContain('answer could not be read');
    expect(body.notices.join(' ')).not.toContain('could not be reached');
  });

  it('reports unusable JSON on the parse route as bad_output', async () => {
    selectProvider.mockReturnValue({
      provider: {
        id: 'gemini' as const,
        generate: vi.fn(async () => ({
          mode: 'provider' as const,
          provider: 'gemini' as const,
          content: '{} trailing junk',
          notices: [],
        })),
      },
      live: true,
      notice: null,
    });

    const response = await parse(request({ text: 'A wedding for 120 people in December' }));
    const body = (await response.json()) as {
      mode: string;
      notices: string[];
      providerError: string;
    };

    expect(body.mode).toBe('basic');
    expect(body.providerError).toBe('bad_output');
    expect(body.notices.join(' ')).toContain('answer could not be read');
  });

  it('puts the kind in the chat stream', async () => {
    selectProvider.mockReturnValue(rejecting('timeout'));

    const response = await chat(
      request({ message: 'What should we do next?', planSummary: 'x', snapshot }),
    );
    const text = await response.text();

    expect(text).toContain('"providerError":"timeout"');
    expect(text).toContain('took too long');
    expect(text).not.toContain('provider detail secret');
  });

  it('logs the kind and never the provider message', async () => {
    selectProvider.mockReturnValue(rejecting('auth'));

    const warn = vi.spyOn(console, 'warn');
    await ideasBody();

    const line = String(warn.mock.calls.at(-1)?.[0]);
    const payload = JSON.parse(line) as Record<string, unknown>;

    expect(payload['providerError']).toBe('auth');
    expect(line).not.toContain('provider detail secret');
    expect(line).not.toContain('planSummary');
  });
});
