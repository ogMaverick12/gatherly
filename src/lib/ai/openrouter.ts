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
 * Room for the answer plus any reasoning the model does first.
 * Reasoning tokens are counted in `max_tokens`, so a small cap can end the
 * stream before the answer starts.
 */
const MAX_TOKENS = 2048;

interface ChatCompletionsBody {
  choices?: { message?: { content?: string } }[];
}

/** Classify a transport failure; the provider's message never leaves here. */
function asProviderError(error: unknown): ProviderError {
  if (error instanceof ProviderError) return error;

  const kind: ProviderErrorKind = isTimeout(error) ? 'timeout' : 'network';
  return new ProviderError(`OpenRouter request failed (${kind}).`, isRetryableKind(kind), kind);
}

/** Read the answer, or refuse it when there is nothing usable. */
async function readContent(response: Response): Promise<string> {
  let payload: ChatCompletionsBody;
  try {
    payload = (await response.json()) as ChatCompletionsBody;
  } catch {
    throw new ProviderError('The provider answer was not JSON.', false, 'bad_output');
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new ProviderError('The provider returned an empty answer.', false, 'bad_output');
  }
  return content;
}

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
      const response = await this.send(request);

      return {
        mode: 'provider',
        provider: 'openrouter',
        content: await readContent(response),
        notices: [],
      };
    } catch (error) {
      throw asProviderError(error);
    }
  }

  private async send(request: GenerationRequest): Promise<Response> {
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
        max_tokens: MAX_TOKENS,
        messages: [
          { role: 'system', content: request.systemPrompt },
          { role: 'user', content: buildUserMessage(request) },
        ],
        ...(request.responseFormat === 'json' ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
      cache: 'no-store',
    });

    if (!response.ok) {
      const kind = kindFromStatus(response.status);
      throw new ProviderError(`OpenRouter request failed (${kind}).`, isRetryableKind(kind), kind);
    }

    return response;
  }
}
