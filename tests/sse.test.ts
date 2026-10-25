import { describe, expect, it } from 'vitest';
import { readSse, type SseEvent } from '@/lib/ai/sse';

/**
 * The server-sent events reader shared by the provider adapters.
 *
 * The network does not respect frame boundaries, so the cases that matter are
 * a frame arriving in pieces, a frame with no data, and a last frame that never
 * gets its closing blank line.
 */

const encoder = new TextEncoder();

/** A body that arrives in exactly these pieces, one network chunk each. */
function body(pieces: readonly string[]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const piece of pieces) controller.enqueue(encoder.encode(piece));
      controller.close();
    },
  });
}

async function collect(pieces: readonly string[]): Promise<SseEvent[]> {
  const events: SseEvent[] = [];
  for await (const event of readSse(body(pieces))) events.push(event);
  return events;
}

describe('the SSE reader', () => {
  it('reads every complete frame in order', async () => {
    await expect(collect(['data: one\n\ndata: two\n\n'])).resolves.toEqual([
      { event: 'message', data: 'one' },
      { event: 'message', data: 'two' },
    ]);
  });

  it('reads a frame split across network chunks', async () => {
    await expect(collect(['da', 'ta: {"a"', ':1}\n', '\n'])).resolves.toEqual([
      { event: 'message', data: '{"a":1}' },
    ]);
  });

  it('keeps an event name and joins multiple data lines', async () => {
    await expect(collect(['event: delta\ndata: a\ndata: b\n\n'])).resolves.toEqual([
      { event: 'delta', data: 'a\nb' },
    ]);
  });

  it('skips comment lines and blocks that carry no data', async () => {
    await expect(
      collect([': keep-alive\n\n', 'event: ping\n\n', 'data: real\n\n']),
    ).resolves.toEqual([{ event: 'message', data: 'real' }]);
  });

  it('normalises CRLF line endings', async () => {
    await expect(collect(['event: delta\r\ndata: hi\r\n\r\n'])).resolves.toEqual([
      { event: 'delta', data: 'hi' },
    ]);
  });

  it('yields a trailing frame that never got its blank line', async () => {
    await expect(collect(['data: last\n'])).resolves.toEqual([{ event: 'message', data: 'last' }]);
  });

  it('yields nothing for an empty body', async () => {
    await expect(collect([])).resolves.toEqual([]);
  });
});
