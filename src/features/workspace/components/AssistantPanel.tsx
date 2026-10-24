'use client';

import { useRef, useState } from 'react';
import { useAccessibility } from '@/features/accessibility/provider';
import type { PlanView } from '@/lib/plan-view';
import type { ChatMessage } from '@/lib/plan';
import {
  buildBasicAnswer,
  classifyIntent,
  renderSnapshotForModel,
} from '@/features/assistant/services';

interface StreamEvent {
  event: string;
  data: unknown;
}

async function readEventStream(response: Response): Promise<StreamEvent[]> {
  const events: StreamEvent[] = [];
  const reader = response.body?.getReader();
  if (!reader) return events;

  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const chunk = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf('\n\n');

      let event = 'message';
      const dataLines: string[] = [];
      for (const line of chunk.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
      }
      if (dataLines.length === 0) continue;
      try {
        events.push({ event, data: JSON.parse(dataLines.join('\n')) as unknown });
      } catch {
        // A malformed frame is ignored rather than breaking the answer.
      }
    }
  }

  return events;
}

export function AssistantPanel({
  view,
  onSend,
}: {
  view: PlanView;
  onSend: (message: ChatMessage) => void;
}) {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [notices, setNotices] = useState<readonly string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const ask = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setDraft('');
    setLoading(true);
    setNotices([]);

    const userMessage: ChatMessage = {
      id: `chat_user_${Date.now().toString(36)}`,
      role: 'user',
      content: trimmed,
      mode: null,
      createdAt: new Date().toISOString(),
    };
    onSend(userMessage);

    let answer = '';
    let mode: 'basic' | 'provider' = 'basic';
    let streamNotices: string[] = [];

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          planSummary: renderSnapshotForModel(view.snapshot),
          snapshot: view.snapshot,
        }),
      });

      if (!response.ok) throw new Error('chat_failed');

      for (const event of await readEventStream(response)) {
        if (event.event === 'mode') {
          // The route announces the mode before the answer, so the badge is
          // never wrong about where the answer came from.
          const data = event.data as { live?: boolean };
          if (data.live === false) mode = 'basic';
        }
        if (event.event === 'delta') {
          const data = event.data as { text?: string };
          if (typeof data.text === 'string') answer = data.text;
        }
        if (event.event === 'done') {
          const data = event.data as { mode?: 'basic' | 'provider'; notices?: string[] };
          if (data.mode) mode = data.mode;
          streamNotices = data.notices ?? [];
        }
      }
    } catch {
      // Offline or the route is unavailable: answer locally with the same
      // deterministic rules, and say so rather than pretending.
      answer = buildBasicAnswer(classifyIntent(trimmed), view.snapshot);
      mode = 'basic';
      streamNotices = [t.errors.offline];
    }

    setNotices(streamNotices);

    onSend({
      id: `chat_assistant_${Date.now().toString(36)}`,
      role: 'assistant',
      content: answer,
      mode,
      createdAt: new Date().toISOString(),
    });

    setLoading(false);
    window.setTimeout(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, 40);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-title">{t.workspace.assistantTitle}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t.workspace.assistantHelp}</p>
      </div>

      <div
        ref={listRef}
        className="max-h-[28rem] space-y-3 overflow-y-auto rounded-card border border-line bg-paper p-4"
        role="log"
        aria-live="polite"
        aria-label={t.workspace.assistantTitle}
      >
        {view.plan.chat.length === 0 ? (
          <p className="text-sm text-ink-muted">{t.workspace.assistantPlaceholder}</p>
        ) : (
          view.plan.chat.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-card border p-3 text-sm ${
                message.role === 'user'
                  ? 'ml-auto border-teal/40 bg-teal/10'
                  : 'border-line bg-raised'
              }`}
            >
              <p className="whitespace-pre-wrap text-ink">{message.content}</p>
              {message.mode ? (
                <p className="mt-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-ink-muted">
                  {message.mode === 'basic' ? t.workspace.basicMode : t.workspace.providerMode}
                </p>
              ) : null}
            </div>
          ))
        )}
        {loading ? <p className="text-sm text-ink-muted">{t.common.loading}</p> : null}
      </div>

      {notices.length > 0 ? (
        <ul role="status" className="space-y-1 text-sm text-ink-muted">
          {notices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
        </ul>
      ) : null}

      <p className="rounded-card border border-line bg-paper p-3 text-xs text-ink-muted">
        {t.workspace.basicModeHelp}
      </p>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(draft);
        }}
      >
        <label htmlFor="assistant-input" className="sr-only">
          {t.workspace.assistantTitle}
        </label>
        <input
          id="assistant-input"
          type="text"
          value={draft}
          maxLength={2000}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t.workspace.assistantPlaceholder}
          className="min-h-[44px] flex-1 rounded-pill border border-line bg-raised px-4 py-2 text-sm text-ink placeholder:text-ink-muted/70"
        />
        <button
          type="submit"
          disabled={loading || draft.trim().length === 0}
          className="inline-flex min-h-[44px] items-center justify-center rounded-pill border border-ink px-5 py-2 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-ink hover:text-paper disabled:opacity-60"
        >
          {t.workspace.send}
        </button>
      </form>
    </div>
  );
}
