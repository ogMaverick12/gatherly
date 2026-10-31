/**
 * A server-sent events reader.
 *
 * Written by hand because both providers send SSE with the same quirks: a
 * frame can arrive split across network chunks, comment lines start with a
 * colon, and a block ends at a blank line. Reading it once here keeps the
 * adapter that uses it small.
 */

export interface SseEvent {
  readonly event: string;
  readonly data: string;
}

/**
 * Turn one raw block into an event, or null when the block carries no data.
 *
 * @param block the text between two blank lines
 * @returns the event name and its joined data lines
 */
function parseBlock(block: string): SseEvent | null {
  let event = 'message';
  const data: string[] = [];

  for (const line of block.split('\n')) {
    if (line.startsWith(':')) continue;
    if (line.startsWith('event:')) event = line.slice(6).trim();
    if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
  }

  return data.length > 0 ? { event, data: data.join('\n') } : null;
}

/** Split every complete block out of the buffer. */
function drainBlocks(buffer: string): { events: SseEvent[]; rest: string } {
  const events: SseEvent[] = [];
  let rest = buffer;
  let boundary = rest.indexOf('\n\n');
  while (boundary !== -1) {
    const event = parseBlock(rest.slice(0, boundary));
    rest = rest.slice(boundary + 2);
    if (event) events.push(event);
    boundary = rest.indexOf('\n\n');
  }
  return { events, rest };
}

/**
 * Read events from a stream as they arrive.
 *
 * @param body the response body, which must not be locked yet
 * @returns every complete event, in order, followed by a trailing partial one
 */
export async function* readSse(body: ReadableStream<Uint8Array>): AsyncGenerator<SseEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      const drained = drainBlocks(buffer);
      buffer = drained.rest;
      for (const event of drained.events) yield event;
    }

    // A last block without its closing blank line still counts.
    const last = parseBlock(buffer + decoder.decode());
    if (last) yield last;
  } finally {
    reader.releaseLock();
  }
}
