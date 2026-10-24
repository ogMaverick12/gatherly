import { ApiError, GoogleGenAI, ThinkingLevel, type GenerateContentConfig } from '@google/genai';
import { isRetryableKind, isTimeout, kindFromStatus } from './errors';
import {
  ProviderError,
  type GenerationRequest,
  type GenerationResult,
  type Provider,
  type ProviderErrorKind,
} from './provider';
import { buildUserMessage } from './prompts';

/**
 * The thinking setting for every call.
 *
 * Thinking tokens count against maxOutputTokens, so the lowest level leaves
 * the most room for the answer. Gemini 3.6 Flash supports `minimal`; Gemini
 * 3.8 Flash does not, so a model override to 3.8 needs a change here. See
 * docs/LIVE_VERIFICATION.md for the ids and the source of that table.
 */
const THINKING_LEVEL = ThinkingLevel.MINIMAL;

/** Room for a short answer even when the model does reason a little. */
const MAX_OUTPUT_TOKENS = 2048;

/**
 * Classify an SDK failure.
 *
 * The provider's own message can echo the request, so only the kind is carried
 * forward; the log records that and nothing else.
 */
function asProviderError(error: unknown): ProviderError {
  if (error instanceof ProviderError) return error;

  const kind: ProviderErrorKind =
    error instanceof ApiError
      ? kindFromStatus(error.status)
      : isTimeout(error)
        ? 'timeout'
        : 'network';

  return new ProviderError(`Gemini request failed (${kind}).`, isRetryableKind(kind), kind);
}

/**
 * Gemini adapter.
 *
 * Uses the official Google Gen AI SDK. The API key stays on the server and
 * is never exposed to the browser. The request is bounded by a timeout and
 * a single retry on a transient failure.
 */
export class GeminiProvider implements Provider {
  readonly id = 'gemini' as const;

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly timeoutMs = 15_000,
  ) {}

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    const client = new GoogleGenAI({ apiKey: this.apiKey });

    try {
      const response = await client.models.generateContent({
        model: this.model,
        contents: [{ role: 'user', parts: [{ text: buildUserMessage(request) }] }],
        config: this.requestConfig(request),
      });

      const text = response.text?.trim();
      if (!text) {
        throw new ProviderError('The provider returned an empty answer.', false, 'bad_output');
      }

      return {
        mode: 'provider',
        provider: 'gemini',
        content: text,
        notices: [],
      };
    } catch (error) {
      throw asProviderError(error);
    }
  }

  private requestConfig(request: GenerationRequest): GenerateContentConfig {
    return {
      systemInstruction: {
        role: 'system',
        parts: [{ text: request.systemPrompt }],
      },
      temperature: 0.3,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      thinkingConfig: { thinkingLevel: THINKING_LEVEL },
      ...(request.responseFormat === 'json' ? { responseMimeType: 'application/json' } : {}),
      abortSignal: AbortSignal.timeout(this.timeoutMs),
    };
  }
}
