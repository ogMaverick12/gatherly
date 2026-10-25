'use client';

/**
 * Reading the chat event stream in the browser.
 *
 * The frames are applied in order as they arrive, so the answer can grow on
 * screen instead of appearing all at once at the end.
 */

export type Mode = 'basic' | 'provider';

export interface StreamEvent {
  readonly event: string;
  readonly data: unknown;
}

export interface StreamedAnswer {
  readonly mode: Mode;
  readonly content: string;
  readonly notices: readonly string[];
  /** True when the provider stopped after some text had been shown. */
  readonly interrupted: boolean;
}

/**
 * The answer before anything has arrived.
 *
 * @param mode the mode the badge starts in
 * @returns an empty answer in that mode
 */
export function emptyAnswer(mode: Mode = 'basic'): StreamedAnswer {
  return { mode, content: '', notices: [], interrupted: false };
}

/**
 * Apply one frame to the answer shown so far.
 *
 * @param answer the answer accumulated so far
 * @param frame one parsed event from the route
 * @returns the next state, unchanged for a frame it does not recognise
 */
export function applyFrame(answer: StreamedAnswer, frame: StreamEvent): StreamedAnswer {
  if (frame.event === 'mode') {
    const data = frame.data as { live?: boolean };
    return { ...answer, mode: data.live === false ? 'basic' : 'provider' };
  }

  if (frame.event === 'delta') {
    const data = frame.data as { text?: string };
    if (typeof data.text !== 'string') return answer;
    return { ...answer, content: answer.content + data.text };
  }

  if (frame.event === 'error') {
    const data = frame.data as { message?: string };
    if (typeof data.message !== 'string') return answer;
    return { ...answer, notices: [...answer.notices, data.message], interrupted: true };
  }

  if (frame.event === 'done') {
    const data = frame.data as { mode?: Mode; notices?: string[]; interrupted?: boolean };
    return {
      ...answer,
      mode: data.mode ?? answer.mode,
      notices: data.notices ?? answer.notices,
      interrupted: data.interrupted ?? answer.interrupted,
    };
  }

  return answer;
}

/** One block of the stream, or null when it carries no readable data. */
function parseFrame(block: string): StreamEvent | null {
  let event = 'message';
  const dataLines: string[] = [];

  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
  }

  if (dataLines.length === 0) return null;
  try {
    return { event, data: JSON.parse(dataLines.join('\n')) as unknown };
  } catch {
    // A malformed frame is ignored rather than breaking the answer.
    return null;
  }
}

/**
 * Read the response body, handing each frame over as it arrives.
 *
 * @param response the chat response
 * @param onEvent called once per parsed frame, in order
 */
export async function readEventStream(
  response: Response,
  onEvent: (frame: StreamEvent) => void,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const parsed = parseFrame(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      if (parsed) onEvent(parsed);
      boundary = buffer.indexOf('\n\n');
    }
  }
}
