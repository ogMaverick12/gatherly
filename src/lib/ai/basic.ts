import type { GenerationRequest, GenerationResult, Provider } from './provider';

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
}
