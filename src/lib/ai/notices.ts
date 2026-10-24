import type { ProviderErrorKind } from './provider';

/**
 * One plain sentence per failure kind.
 *
 * The notice says what happened and what the reader is seeing instead, so the
 * mode badge is never the only signal. No status codes, no provider internals
 * and no user text: this sentence is shown to the person planning the event.
 */
const REASONS: Record<ProviderErrorKind, string> = {
  timeout: 'The AI provider took too long',
  rate_limited: 'The AI provider is busy right now',
  model_not_found: 'The configured AI model could not be found',
  auth: 'The AI provider rejected the configured key',
  bad_output: 'The AI answer could not be read',
  server: 'The AI provider had a server error',
  network: 'The AI provider could not be reached',
};

/**
 * Build the notice shown next to the mode badge.
 *
 * @param kind the classified provider failure
 * @param consequence what the app did instead, e.g. 'so this answer comes from Basic mode.'
 * @returns a plain sentence naming the reason and the consequence
 */
export function providerErrorNotice(kind: ProviderErrorKind, consequence: string): string {
  return `${REASONS[kind]}, ${consequence}`;
}
