'use client';

import type { RefObject } from 'react';
import type { Dictionary } from '@/lib/i18n';
import type { ChatMessage } from '@/lib/plan';
import type { StreamedAnswer } from './assistant-stream';

/**
 * The conversation, including an answer that is still arriving.
 *
 * The live bubble is `aria-live="off"` on purpose: announcing every chunk
 * would talk over the reader. The finished message lands in the polite log,
 * so completion is announced once, with the full answer.
 */
export function AssistantLog({
  messages,
  live,
  t,
  scrollRef,
}: {
  messages: readonly ChatMessage[];
  live: StreamedAnswer | null;
  t: Dictionary;
  scrollRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={scrollRef}
      className="max-h-[28rem] space-y-3 overflow-y-auto rounded-card border border-line bg-paper p-4"
      role="log"
      aria-live="polite"
      aria-busy={Boolean(live)}
      aria-label={t.workspace.assistantTitle}
    >
      {messages.length === 0 && !live ? (
        <p className="text-sm text-ink-muted">{t.workspace.assistantPlaceholder}</p>
      ) : null}

      {messages.map((message) => (
        <div
          key={message.id}
          className={`max-w-[85%] rounded-card border p-3 text-sm ${
            message.role === 'user' ? 'ml-auto border-teal/40 bg-teal/10' : 'border-line bg-raised'
          }`}
        >
          <p className="whitespace-pre-wrap text-ink">{message.content}</p>
          {message.mode ? (
            <p className="mt-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink-muted">
              {message.mode === 'basic' ? t.workspace.basicMode : t.workspace.providerMode}
            </p>
          ) : null}
        </div>
      ))}

      {live ? (
        <div
          data-testid="assistant-stream"
          aria-live="off"
          className="max-w-[85%] rounded-card border border-line bg-raised p-3 text-sm"
        >
          <p className="whitespace-pre-wrap text-ink">
            {live.content}
            {/* The caret is the only motion, and motion-safe drops it when
                the reader asked for reduced motion. */}
            <span
              aria-hidden="true"
              className="ml-0.5 inline-block h-3 w-1 rounded-pill bg-ink-muted align-middle motion-safe:animate-pulse"
            />
          </p>
          <p className="mt-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink-muted">
            {live.mode === 'basic' ? t.workspace.basicMode : t.workspace.providerMode}
          </p>
        </div>
      ) : null}
    </div>
  );
}
