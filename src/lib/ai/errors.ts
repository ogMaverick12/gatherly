/**
 * Classifying provider failures into the small set of kinds routes act on.
 * Adapters carry only the kind forward, never the provider's own message.
 */
import { ProviderError, type ProviderErrorKind } from './provider';

/** The failure kinds worth trying again: a transient condition, not our bug. */
const RETRYABLE: ReadonlySet<ProviderErrorKind> = new Set([
  'timeout',
  'rate_limited',
  'server',
  'network',
]);

/**
 * Map an HTTP status from either provider onto a failure kind.
 *
 * 404 is the one that matters most: it means the configured model id does not
 * exist, which is a configuration problem, not an outage.
 *
 * @param status the HTTP status the provider returned
 * @returns the classified kind
 */
export function kindFromStatus(status: number): ProviderErrorKind {
  if (status === 404) return 'model_not_found';
  if (status === 401 || status === 403) return 'auth';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'server';
  return 'bad_output';
}

/**
 * True when a failure kind is worth the single retry.
 *
 * @param kind the classified failure
 * @returns whether `generateWithRetry` may try once more
 */
export function isRetryableKind(kind: ProviderErrorKind): boolean {
  return RETRYABLE.has(kind);
}

/**
 * True when an error is an abort or a timeout, in any of the shapes fetch uses.
 *
 * @param error the thrown value
 * @returns whether the call ran out of time
 */
export function isTimeout(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'name' in error) {
    const name = String(error.name);
    if (name === 'TimeoutError' || name === 'AbortError') return true;
  }

  return /timeout|timed out|aborted/i.test(messageOf(error));
}

/**
 * Classify anything a route caught while asking a provider.
 *
 * A route's own deadline arrives as the guards' `HttpError` with a 504
 * status; it is the same timeout, so it gets the same kind.
 *
 * @param error the thrown value
 * @returns the failure kind to show and log
 */
export function kindOfFailure(error: unknown): ProviderErrorKind {
  if (error instanceof ProviderError) return error.kind;
  if (typeof error === 'object' && error !== null && 'status' in error) {
    if (Number(error.status) === 504) return 'timeout';
  }
  return 'network';
}

/**
 * The message of an unknown thrown value.
 *
 * @param error the thrown value
 * @returns its message, or a neutral fallback
 */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown provider error';
}
