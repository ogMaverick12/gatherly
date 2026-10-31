/**
 * The mechanics of one streamed provider attempt: first chunk, retry, fallback.
 * Kept apart from the route stream so each decision is testable on its own.
 */
import { splitSentences } from './basic';
import { isRetryableKind, kindOfFailure } from './errors';
import { providerErrorNotice } from './notices';
import {
  RETRY_BACKOFF_MS,
  type GenerationRequest,
  type Provider,
  type ProviderErrorKind,
  type Sleep,
} from './provider';

/** The frame writer for one response; it returns false once the client is gone. */
export type Write = (event: string, data: unknown) => boolean;

/** One provider attempt and its retry decision. */
export interface Attempt {
  /** True when nothing had been shown, so Basic mode can answer instead. */
  readonly fallback: boolean;
  readonly text: string;
  readonly interrupted: boolean;
  readonly kind: ProviderErrorKind | null;
}

/**
 * Keep pulling chunks after the first one.
 *
 * A failure here happens with text already on screen, so the reader is told
 * plainly that the answer stops, and the text stays put.
 *
 * @param iterator the rest of the provider's stream
 * @param write the frame writer, which returns false once the client is gone
 * @param start the text already sent
 * @returns how the stream ended
 */
async function pumpRest(
  iterator: AsyncIterator<string>,
  write: Write,
  start: string,
): Promise<Attempt> {
  let text = start;

  try {
    for (;;) {
      const next = await iterator.next();
      if (next.done) return { fallback: false, text, interrupted: false, kind: null };
      if (!next.value) continue;
      if (!write('delta', { text: next.value })) {
        return { fallback: false, text, interrupted: true, kind: null };
      }
      text += next.value;
    }
  } catch (error) {
    const kind = kindOfFailure(error);
    write('error', { message: providerErrorNotice(kind, 'The answer stops here.') });
    return { fallback: false, text, interrupted: true, kind };
  }
}

/** Wait before the one retry, as the non-streaming path does. */
const defaultSleep: Sleep = (ms) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** A stream that has produced its first chunk. */
interface StartedAttempt {
  readonly iterator: AsyncIterator<string>;
  readonly first: IteratorResult<string>;
}

/** Either a started stream or the failure that stopped it. */
type FirstChunkResult =
  | { readonly started: StartedAttempt; readonly kind: null }
  | { readonly started: null; readonly kind: ProviderErrorKind };

/** The result of a provider attempt that never committed any text. */
function fallbackAttempt(kind: ProviderErrorKind): Attempt {
  return { fallback: true, text: '', interrupted: false, kind };
}

/** Open a fresh stream and take its first chunk, or throw before anything is sent. */
async function firstChunk(provider: Provider, request: GenerationRequest): Promise<StartedAttempt> {
  const iterator = provider.stream(request)[Symbol.asyncIterator]();
  return { iterator, first: await iterator.next() };
}

/** Try one stream open, converting a provider failure into a result. */
async function tryFirstChunk(
  provider: Provider,
  request: GenerationRequest,
): Promise<FirstChunkResult> {
  try {
    return { started: await firstChunk(provider, request), kind: null };
  } catch (error) {
    return { started: null, kind: kindOfFailure(error) };
  }
}

/** A client that has gone away is not a transient provider problem. */
function canRetry(kind: ProviderErrorKind, request: GenerationRequest): boolean {
  return isRetryableKind(kind) && !request.signal?.aborted;
}

/** Open once, then retry a transient failure once before giving up. */
async function firstChunkWithRetry(
  provider: Provider,
  request: GenerationRequest,
  sleep: Sleep,
): Promise<FirstChunkResult> {
  const first = await tryFirstChunk(provider, request);
  if (first.started || !canRetry(first.kind, request)) return first;
  await sleep(RETRY_BACKOFF_MS);
  return tryFirstChunk(provider, request);
}

/**
 * Ask the provider for its first chunk before committing to it.
 *
 * A failure before any text has been sent is recoverable: a transient one is
 * retried once, exactly as the non-streaming path is, and anything else falls
 * back to Basic mode, which says why.
 *
 * @param provider the selected live provider
 * @param request its request, including the signal that stops it
 * @param write the frame writer
 * @param sleep used by tests to make the retry's backoff instant
 * @returns what was sent and how the attempt ended
 */
export async function providerAttempt(
  provider: Provider,
  request: GenerationRequest,
  write: Write,
  sleep: Sleep = defaultSleep,
): Promise<Attempt> {
  const attempt = await firstChunkWithRetry(provider, request, sleep);
  if (!attempt.started) return fallbackAttempt(attempt.kind);

  const { iterator, first } = attempt.started;
  const firstText = first.done ? '' : first.value;
  if (!firstText.trim()) {
    // An empty stream is an unusable answer, not an outage: the provider
    // answered, it just answered nothing.
    return fallbackAttempt('bad_output');
  }

  if (!write('delta', { text: firstText })) {
    return { fallback: false, text: firstText, interrupted: true, kind: null };
  }

  return pumpRest(iterator, write, firstText);
}

/**
 * Send the deterministic answer a sentence at a time.
 *
 * @param answer the Basic-mode answer
 * @param write the frame writer
 * @returns the text that reached the client
 */
export async function sendBasic(answer: string, write: Write): Promise<string> {
  let text = '';
  for (const chunk of splitSentences(answer)) {
    if (!write('delta', { text: chunk })) break;
    text += chunk;
  }
  return text;
}
