/**
 * The streaming chat response: `mode`, text `delta` frames and a final `done`.
 * Basic mode and provider failures fall back to the deterministic answer.
 */
import { providerErrorNotice } from './notices';
import type { GenerationMode, GenerationRequest, Provider, ProviderErrorKind } from './provider';
import { sendBasic, providerAttempt, type Write } from './chat-attempt';
import { combineSignals } from './signal';

/**
 * The chat route's own budget, unchanged from the non-streaming route.
 *
 * A provider still gets 15 s of its own; this is the ceiling for the whole
 * answer, so a model that trickles forever cannot hold the request open.
 */
const STREAM_BUDGET_MS = 20_000;

export interface ChatStreamOptions {
  readonly provider: Provider;
  readonly live: boolean;
  readonly request: GenerationRequest;
  /** The deterministic answer, used in Basic mode and as the fallback. */
  readonly basicAnswer: string;
  readonly selectionNotice?: string | null;
  /** The browser went away; the provider call must stop with it. */
  readonly clientSignal?: AbortSignal;
  /** Called once, when the stream is finished, with the failure kind for the log. */
  readonly onComplete?: (providerError: ProviderErrorKind | null) => void;
}

interface StreamResult {
  readonly mode: GenerationMode;
  readonly notices: readonly string[];
  readonly providerError: ProviderErrorKind | null;
  readonly interrupted: boolean;
}

interface StreamWriter {
  readonly write: Write;
  close(): void;
}

/** Build the SSE writer and its one-way closed flag. */
function createWriter(controller: ReadableStreamDefaultController<Uint8Array>): StreamWriter {
  const encoder = new TextEncoder();
  let closed = false;
  const write: Write = (event, data) => {
    if (closed) return false;
    try {
      controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      return true;
    } catch {
      // The client is gone; nothing more can be delivered.
      closed = true;
      return false;
    }
  };
  const close = () => {
    if (closed) return;
    closed = true;
    controller.close();
  };
  return { write, close };
}

/** Run the provider or Basic answer and keep the mode, notices and failure kind. */
async function runAnswer(
  options: ChatStreamOptions,
  signal: AbortSignal | undefined,
  write: Write,
): Promise<StreamResult> {
  const notices: string[] = options.selectionNotice ? [options.selectionNotice] : [];
  let mode: GenerationMode = 'basic';
  let interrupted = false;
  let providerError: ProviderErrorKind | null = null;

  try {
    if (options.live) {
      const attempt = await providerAttempt(
        options.provider,
        { ...options.request, signal },
        write,
      );
      if (attempt.fallback) {
        providerError = attempt.kind ?? 'bad_output';
        notices.push(providerErrorNotice(providerError, 'so this answer comes from Basic mode.'));
        // The badge changes too: the answer below is not the model's.
        write('mode', { provider: 'basic', live: false });
        await sendBasic(options.basicAnswer, write);
      } else {
        providerError = attempt.kind;
        interrupted = attempt.interrupted;
        mode = 'provider';
      }
    } else {
      await sendBasic(options.basicAnswer, write);
    }
  } catch {
    // Nothing above should throw, but a response must still end cleanly.
    write('error', { message: providerErrorNotice('network', 'The answer stops here.') });
    interrupted = true;
  }

  return { mode, notices, providerError, interrupted };
}

/** Send the mode frame, enforce the deadline and return the answer result. */
async function writeChatStream(options: ChatStreamOptions, writer: StreamWriter) {
  writer.write('mode', { provider: options.provider.id, live: options.live });
  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(), STREAM_BUDGET_MS);
  const signal = combineSignals([deadline.signal, options.clientSignal]);
  try {
    return await runAnswer(options, signal, writer.write);
  } finally {
    clearTimeout(timer);
  }
}

/** Build a completion callback that runs at most once. */
function createFinish(options: ChatStreamOptions) {
  let completed = false;
  return (providerError: ProviderErrorKind | null) => {
    if (completed) return;
    completed = true;
    options.onComplete?.(providerError);
  };
}

/**
 * A streamed chat answer, as server-sent events.
 *
 * The order is fixed and the client relies on it: `mode` first, then one
 * `delta` per chunk, then `done`. A provider that fails after text has been
 * sent adds an `error` frame and keeps what was already delivered.
 *
 * @param options the selected provider, its request, the fallback answer
 * @returns the response body to hand to the client
 */
export function chatEventStream(options: ChatStreamOptions): ReadableStream<Uint8Array> {
  const finish = createFinish(options);
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const writer = createWriter(controller);
      const result = await writeChatStream(options, writer);
      writer.write('done', {
        mode: result.mode,
        notices: result.notices,
        providerError: result.providerError,
        interrupted: result.interrupted,
      });
      writer.close();
      finish(result.providerError);
    },
  });
}
