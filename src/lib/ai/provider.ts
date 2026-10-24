/**
 * The provider interface.
 *
 * Everything AI-related in Gatherly goes through this one shape, so the
 * product never depends on a specific vendor and the deterministic
 * fallback is always available.
 */

export type ProviderId = 'gemini' | 'openrouter' | 'basic';

export type GenerationMode = 'basic' | 'provider';

export interface GenerationRequest {
  /** A short machine-readable intent such as "chat" or "ideas". */
  readonly intent: string;
  readonly systemPrompt: string;
  /** The user's own words. Treated as data, never as instructions. */
  readonly userText: string;
  /** A bounded, machine-generated summary of the plan. */
  readonly planSummary: string;
  /** The deterministic answer, used by Basic mode and as the fallback. */
  readonly basicAnswer: string;
  /** Ask the provider for a JSON object matching a schema. */
  readonly responseFormat?: 'text' | 'json';
}

export interface GenerationResult {
  readonly mode: GenerationMode;
  readonly provider: ProviderId;
  readonly content: string;
  /** Human-readable notes, e.g. "the provider timed out, so this is Basic mode". */
  readonly notices: readonly string[];
}

export interface Provider {
  readonly id: ProviderId;
  generate(request: GenerationRequest): Promise<GenerationResult>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean = false,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/** The one retry the product allows, and the backoff it waits for. */
export const RETRY_BACKOFF_MS = 400;

export type Sleep = (ms: number) => Promise<void>;

/**
 * Call a provider, retrying once when the failure looks transient.
 *
 * Only a retryable failure is retried: a rate limit (429) or a server
 * failure (502/503/504). Every other error is passed straight through, so
 * a bad request is never sent twice.
 */
export async function generateWithRetry(
  provider: Provider,
  request: GenerationRequest,
  options: { backoffMs?: number; sleep?: Sleep } = {},
): Promise<GenerationResult> {
  const backoffMs = options.backoffMs ?? RETRY_BACKOFF_MS;
  const sleep: Sleep =
    options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  try {
    return await provider.generate(request);
  } catch (error) {
    if (!(error instanceof ProviderError) || !error.retryable) throw error;
    await sleep(backoffMs);
    return provider.generate(request);
  }
}
