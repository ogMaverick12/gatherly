import {
  ProviderError,
  type GenerationRequest,
  type GenerationResult,
  type Provider,
} from './provider';
import { buildUserMessage } from './prompts';

/**
 * OpenRouter adapter.
 *
 * A plain, bounded fetch. The key is server-side only and the request is
 * capped by a timeout.
 */
export class OpenRouterProvider implements Provider {
  readonly id = 'openrouter' as const;

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly timeoutMs = 15_000,
  ) {}

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Title': 'Gatherly',
        },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.3,
          max_tokens: 700,
          messages: [
            { role: 'system', content: request.systemPrompt },
            { role: 'user', content: buildUserMessage(request) },
          ],
          ...(request.responseFormat === 'json'
            ? { response_format: { type: 'json_object' } }
            : {}),
        }),
        signal: AbortSignal.timeout(this.timeoutMs),
        cache: 'no-store',
      });

      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        throw new ProviderError(
          `OpenRouter request failed with status ${response.status}.`,
          retryable,
        );
      }

      const payload = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const content = payload.choices?.[0]?.message?.content?.trim();
      if (!content) {
        throw new ProviderError('The provider returned an empty answer.');
      }

      return {
        mode: 'provider',
        provider: 'openrouter',
        content,
        notices: [],
      };
    } catch (error) {
      if (error instanceof ProviderError) throw error;
      const message = error instanceof Error ? error.message : 'unknown provider error';
      const retryable = /timeout|429|500|502|503|504|network|fetch/i.test(message);
      throw new ProviderError(`OpenRouter request failed: ${message}`, retryable);
    }
  }
}
