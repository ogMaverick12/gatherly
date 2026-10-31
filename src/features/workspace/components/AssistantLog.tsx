'use client';

/**
 * The conversation transcript, including an answer that is still arriving.
 * The live bubble stays silent to readers, and the finished message is announced once.
 */

import type { RefObject } from 'react';
import { Card, cardClasses } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import type { Dictionary } from '@/lib/i18n';
import type { ChatMessage } from '@/lib/plan';
import type { StreamedAnswer } from './assistant-stream';

/**
 * The conversation, including an answer that is still arriving.
 *
 * The live bubble is `aria-live="off"` on purpose: announcing every chunk
 * would talk over the reader. The finished message lands in the polite log,
 * so completion is announced once, with the full answer.
 * long-function: one log region: the polite and the assertive announcements must keep their DOM order.
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
      className={cardClasses('paper', 'md', 'max-h-[28rem] space-y-3 overflow-y-auto')}
      role="log"
      aria-live="polite"
      aria-busy={Boolean(live)}
      aria-label={t.workspace.assistantTitle}
    >
      {messages.length === 0 && !live ? (
        <p className="text-sm text-ink-muted">{t.workspace.assistantPlaceholder}</p>
      ) : null}

      {messages.map((message) => (
        <Card
          key={message.id}
          tone={message.role === 'user' ? 'user' : 'raised'}
          padding="sm"
          className={`max-w-[85%] text-sm ${message.role === 'user' ? 'ml-auto' : ''}`}
        >
          <p className="whitespace-pre-wrap text-ink">{message.content}</p>
          {message.mode ? (
            <SectionLabel spacing="tight" size="tiny" className="mt-1.5">
              {message.mode === 'basic' ? t.workspace.basicMode : t.workspace.providerMode}
            </SectionLabel>
          ) : null}
        </Card>
      ))}

      {live ? (
        <Card
          data-testid="assistant-stream"
          aria-live="off"
          padding="sm"
          className="max-w-[85%] text-sm"
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
          <SectionLabel spacing="tight" size="tiny" className="mt-1.5">
            {live.mode === 'basic' ? t.workspace.basicMode : t.workspace.providerMode}
          </SectionLabel>
        </Card>
      ) : null}
    </div>
  );
}
