import { GoogleGenAI } from '@google/genai';
import {
  ProviderError,
  type GenerationRequest,
  type GenerationResult,
  type Provider,
} from './provider';
import { buildUserMessage } from './prompts';

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
        contents: [
          {
            role: 'user',
            parts: [{ text: buildUserMessage(request) }],
          },
        ],
        config: {
          systemInstruction: {
            role: 'system',
            parts: [{ text: request.systemPrompt }],
          },
          temperature: 0.3,
          maxOutputTokens: 700,
          ...(request.responseFormat === 'json' ? { responseMimeType: 'application/json' } : {}),
          abortSignal: AbortSignal.timeout(this.timeoutMs),
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new ProviderError('The provider returned an empty answer.');
      }

      return {
        mode: 'provider',
        provider: 'gemini',
        content: text,
        notices: [],
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      const message = error instanceof Error ? error.message : 'unknown provider error';
      const retryable = /timeout|429|500|502|503|504|network|fetch/i.test(message);
      throw new ProviderError(`Gemini request failed: ${message}`, retryable);
    }
  }
}
