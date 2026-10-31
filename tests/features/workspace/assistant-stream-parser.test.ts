import { describe, expect, it, vi } from 'vitest';
import {
  applyFrame,
  emptyAnswer,
  readEventStream,
  type StreamedAnswer,
} from '@/features/workspace/components/assistant-stream';

describe('applying assistant frames', () => {
  it('adds an error notice and marks the answer interrupted', () => {
    const next = applyFrame(emptyAnswer('provider'), {
      event: 'error',
      data: { message: 'The model stopped early.' },
    });

    expect(next.notices).toEqual(['The model stopped early.']);
    expect(next.interrupted).toBe(true);
  });

  it('leaves the answer untouched when a frame has no usable text or message', () => {
    const answer = emptyAnswer('provider');

    expect(applyFrame(answer, { event: 'delta', data: { text: 42 } })).toBe(answer);
    expect(applyFrame(answer, { event: 'error', data: {} })).toBe(answer);
  });

  it('keeps the present values when the done frame omits them', () => {
    const answer: StreamedAnswer = {
      mode: 'provider',
      content: 'Food is 28%.',
      notices: ['The provider fell back once.'],
      interrupted: true,
    };

    const next = applyFrame(answer, { event: 'done', data: {} });

    expect(next.mode).toBe('provider');
    expect(next.notices).toEqual(['The provider fell back once.']);
    expect(next.interrupted).toBe(true);
  });

  it('ignores an event it does not handle', () => {
    const answer = emptyAnswer('provider');

    expect(applyFrame(answer, { event: 'heartbeat', data: {} })).toBe(answer);
  });
});

describe('reading the assistant event stream', () => {
  it('does nothing when the response has no body', async () => {
    const onEvent = vi.fn();

    await readEventStream(new Response(null, { status: 204 }), onEvent);

    expect(onEvent).not.toHaveBeenCalled();
  });

  it('skips malformed and empty frames but delivers the next readable one', async () => {
    const body = [
      'event: delta\ndata: not-json\n\n',
      'event: delta\n\n',
      'event: delta\ndata: {"text":"kept"}\n\n',
    ].join('');
    const frames: unknown[] = [];

    await readEventStream(new Response(body), (frame) => frames.push(frame));

    expect(frames).toEqual([{ event: 'delta', data: { text: 'kept' } }]);
  });
});
