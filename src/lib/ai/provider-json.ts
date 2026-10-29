/**
 * Ask a provider for JSON and validate the answer with a Zod schema.
 * Every failure becomes a kind, so callers can fall back without throwing.
 */
import type { z } from 'zod';
import { kindOfFailure } from './errors';
import { extractJson } from './json';
import { generateWithRetry } from './provider';
import type { GenerationRequest, Provider, ProviderErrorKind } from './provider';

/** Either the validated data, or the failure kind to fall back on. */
export type JsonOutcome<T> =
  | { readonly ok: true; readonly data: T }
  | { readonly ok: false; readonly kind: ProviderErrorKind };

/**
 * Ask a provider for JSON and validate it against a schema.
 *
 * Everything that can go wrong collapses to one failure kind: the retry
 * policy stays in `generateWithRetry`, and a fenced or malformed answer is
 * `bad_output`, never an outage. The caller decides what to show instead.
 *
 * @param options the provider, its request and the schema the answer must match
 * @returns the validated data or the failure kind
 */
export async function generateJson<T>(options: {
  readonly provider: Provider;
  readonly request: GenerationRequest;
  readonly schema: z.ZodType<T>;
}): Promise<JsonOutcome<T>> {
  try {
    const result = await generateWithRetry(options.provider, options.request);
    const parsed = options.schema.safeParse(extractJson(result.content));
    return parsed.success ? { ok: true, data: parsed.data } : { ok: false, kind: 'bad_output' };
  } catch (error) {
    return { ok: false, kind: kindOfFailure(error) };
  }
}
