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

/** Open a fresh stream and take its first chunk, or throw before anything is sent. */
async function firstChunk(
  provider: Provider,
  request: GenerationRequest,
): Promise<{ iterator: AsyncIterator<string>; first: IteratorResult<string> }> {
  const iterator = provider.stream(request)[Symbol.asyncIterator]();
  return { iterator, first: await iterator.next() };
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
  let started: Awaited<ReturnType<typeof firstChunk>>;
  try {
    started = await firstChunk(provider, request);
  } catch (error) {
    const kind = kindOfFailure(error);
    // A client that has gone away is not a transient provider problem: the
    // retry would make a fresh request nobody is waiting for.
    if (!isRetryableKind(kind) || request.signal?.aborted) {
      return { fallback: true, text: '', interrupted: false, kind };
    }
    await sleep(RETRY_BACKOFF_MS);
    try {
      started = await firstChunk(provider, request);
    } catch (retryError) {
      return { fallback: true, text: '', interrupted: false, kind: kindOfFailure(retryError) };
    }
  }

  const { iterator, first } = started;

  const firstText = first.done ? '' : first.value;
  if (!firstText.trim()) {
    // An empty stream is an unusable answer, not an outage: the provider
    // answered, it just answered nothing.
    return { fallback: true, text: '', interrupted: false, kind: 'bad_output' };
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
