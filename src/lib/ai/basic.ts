import type { GenerationRequest, GenerationResult, Provider } from './provider';

/**
 * Where one sentence ends and the next begins, keeping the whitespace between
 * them so that joining the chunks reproduces the answer exactly.
 */
const SENTENCE_PATTERN = /[^.!?]*[.!?]+[)"'\]]*\s*|[^.!?]+$/g;

/**
 * Split an answer into sentence-sized chunks.
 *
 * Basic mode has no model to stream from, so the honest thing to stream is its
 * own deterministic answer, a sentence at a time.
 *
 * @param text the full deterministic answer
 * @returns the chunks in order; joining them gives the original text back
 */
export function splitSentences(text: string): string[] {
  if (!text.trim()) return [];
  const chunks = text.match(SENTENCE_PATTERN) ?? [text];
  return chunks.filter((chunk) => chunk.length > 0);
}

/**
 * Basic mode.
 *
 * Deterministic, offline and honest. It returns the answer the route
 * computed from the plan's own numbers and never claims to be a model.
 */
export class BasicProvider implements Provider {
  readonly id = 'basic' as const;

  async generate(request: GenerationRequest): Promise<GenerationResult> {
    return {
      mode: 'basic',
      provider: 'basic',
      content: request.basicAnswer,
      notices: [],
    };
  }

  async *stream(request: GenerationRequest): AsyncIterable<string> {
    for (const chunk of splitSentences(request.basicAnswer)) {
      yield chunk;
    }
  }
}
