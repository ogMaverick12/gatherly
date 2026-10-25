/**
 * One signal for two reasons to stop.
 *
 * The provider call has to end when the client goes away *or* when the
 * route's deadline passes, and the SDK takes a single signal. `AbortSignal.any`
 * is not guaranteed on every runtime this app deploys to, so the combination is
 * done by hand here.
 *
 * The listeners are registered without a cleanup step on purpose: every signal
 * passed in belongs to one request and is collected with it.
 *
 * @param signals the signals to watch, any of which may be absent
 * @returns a signal that aborts when the first one does, or undefined for none
 */
export function combineSignals(
  signals: readonly (AbortSignal | undefined)[],
): AbortSignal | undefined {
  const active = signals.filter((signal): signal is AbortSignal => Boolean(signal));
  const [first, ...rest] = active;
  if (!first) return undefined;
  if (rest.length === 0) return first;

  const controller = new AbortController();
  for (const signal of active) {
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true });
  }
  return controller.signal;
}
