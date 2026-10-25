import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssistantPanel } from '@/features/workspace/components/AssistantPanel';
import { setPlan } from '@/lib/plan-store';
import type { ChatMessage } from '@/lib/plan';
import { makeView, renderWithProvider } from '../helpers';

/**
 * The assistant panel while an answer is streaming.
 *
 * The text has to appear as the route sends it, not in one lump at the end,
 * and Stop has to reach the request it started.
 */

const QUESTION = 'How much is the food?';
const encoder = new TextEncoder();

function frame(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/** A fetch whose response body the test drives frame by frame. */
function stubStreamingFetch() {
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  let captured: AbortSignal | null = null;

  const body = new ReadableStream<Uint8Array>({
    start(next) {
      controller = next;
    },
  });

  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init?: RequestInit) => {
      captured = init?.signal ?? null;
      captured?.addEventListener('abort', () => {
        controller?.error(new DOMException('Aborted', 'AbortError'));
      });
      return new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    }),
  );

  return {
    push: (event: string, data: unknown) => controller?.enqueue(frame(event, data)),
    done: () => controller?.close(),
    /** The connection drops, as it would when the network goes away. */
    fail: () => controller?.error(new TypeError('network down')),
    signal: () => captured,
  };
}

beforeEach(() => {
  setPlan(null);
});

describe('the streaming assistant', () => {
  it('adds each delta to the answer as it arrives', async () => {
    const user = userEvent.setup();
    const messages: ChatMessage[] = [];
    const stream = stubStreamingFetch();

    renderWithProvider(
      <AssistantPanel view={makeView()} onSend={(message) => messages.push(message)} />,
    );

    await user.type(screen.getByRole('textbox'), QUESTION);
    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(stream.signal()).not.toBeNull());
    stream.push('mode', { provider: 'gemini', live: true });
    stream.push('delta', { text: 'Food is ' });

    const bubble = await screen.findByTestId('assistant-stream');
    await waitFor(() => expect(bubble).toHaveTextContent('Food is '));

    stream.push('delta', { text: '28% of the budget.' });
    await waitFor(() => expect(bubble).toHaveTextContent('Food is 28% of the budget.'));

    stream.push('done', { mode: 'provider', notices: [], providerError: null });
    stream.done();

    await waitFor(() => expect(messages).toHaveLength(2));
    expect(messages[1]?.content).toBe('Food is 28% of the budget.');
    expect(messages[1]?.mode).toBe('provider');
    expect(screen.queryByTestId('assistant-stream')).not.toBeInTheDocument();
  });

  it('stops the request and keeps the text already shown', async () => {
    const user = userEvent.setup();
    const messages: ChatMessage[] = [];
    const stream = stubStreamingFetch();

    renderWithProvider(
      <AssistantPanel view={makeView()} onSend={(message) => messages.push(message)} />,
    );

    await user.type(screen.getByRole('textbox'), QUESTION);
    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(stream.signal()).not.toBeNull());
    stream.push('mode', { provider: 'gemini', live: true });
    stream.push('delta', { text: 'Food is ' });

    const bubble = await screen.findByTestId('assistant-stream');
    await waitFor(() => expect(bubble).toHaveTextContent('Food is '));

    await user.click(screen.getByRole('button', { name: 'Stop' }));

    await waitFor(() => expect(stream.signal()?.aborted).toBe(true));
    await waitFor(() => expect(messages).toHaveLength(2));
    expect(messages[1]?.content).toBe('Food is ');
    expect(await screen.findByText(/Stopped/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Stop' })).not.toBeInTheDocument();
  });

  it('keeps the mode of text that arrived before the connection dropped', async () => {
    const user = userEvent.setup();
    const messages: ChatMessage[] = [];
    const stream = stubStreamingFetch();

    renderWithProvider(
      <AssistantPanel view={makeView()} onSend={(message) => messages.push(message)} />,
    );

    await user.type(screen.getByRole('textbox'), QUESTION);
    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(stream.signal()).not.toBeNull());
    stream.push('mode', { provider: 'gemini', live: true });
    stream.push('delta', { text: 'Food is ' });

    const bubble = await screen.findByTestId('assistant-stream');
    await waitFor(() => expect(bubble).toHaveTextContent('Food is '));

    stream.fail();

    await waitFor(() => expect(messages).toHaveLength(2));
    expect(messages[1]?.content).toBe('Food is ');
    // It is still the model's text; calling it Basic mode would be a lie.
    expect(messages[1]?.mode).toBe('provider');
    expect(await screen.findByText(/You appear to be offline/)).toBeInTheDocument();
  });
});
