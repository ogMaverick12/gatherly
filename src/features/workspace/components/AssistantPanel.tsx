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
import { AssistantLog } from './AssistantLog';
import {
  applyFrame,
  emptyAnswer,
  readEventStream,
  type Mode,
  type StreamedAnswer,
} from './assistant-stream';

function newMessage(role: ChatMessage['role'], content: string, mode: Mode | null): ChatMessage {
  const stamp = Date.now().toString(36);
  return {
    id: `chat_${role}_${stamp}`,
    role,
    content,
    mode,
    createdAt: new Date().toISOString(),
  };
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
  const [live, setLive] = useState<StreamedAnswer | null>(null);
  const [notices, setNotices] = useState<readonly string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // `scrollTop` rather than `scrollTo`: it is the one form every environment
  // this panel is rendered in supports, the test DOM included.
  const scrollToEnd = () => {
    window.setTimeout(() => {
      const list = listRef.current;
      if (list) list.scrollTop = list.scrollHeight;
    }, 40);
  };

  const ask = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setDraft('');
    setLoading(true);
    setNotices([]);
    onSend(newMessage('user', trimmed, null));

    let answer = emptyAnswer();
    setLive(answer);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          planSummary: renderSnapshotForModel(view.snapshot),
          snapshot: view.snapshot,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('chat_failed');

      await readEventStream(response, (frame) => {
        answer = applyFrame(answer, frame);
        setLive(answer);
        setNotices(answer.notices);
      });
    } catch {
      if (controller.signal.aborted) {
        // The person stopped the answer: keep what is already on screen.
        answer = { ...answer, notices: [...answer.notices, t.workspace.stopped] };
      } else {
        // Offline or the route is unavailable: answer locally with the same
        // deterministic rules, and say so rather than pretending. Text that
        // already arrived keeps its own mode; only a fresh Basic answer is
        // labelled Basic.
        answer = {
          mode: answer.content ? answer.mode : 'basic',
          content: answer.content || buildBasicAnswer(classifyIntent(trimmed), view.snapshot),
          notices: [t.errors.offline],
          interrupted: false,
        };
      }
    }

    abortRef.current = null;
    setNotices(answer.notices);
    setLive(null);
    setLoading(false);

    if (answer.content.trim().length > 0) {
      onSend(newMessage('assistant', answer.content, answer.mode));
    }
    scrollToEnd();
  };

  const stop = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-title">{t.workspace.assistantTitle}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t.workspace.assistantHelp}</p>
      </div>

      <AssistantLog messages={view.plan.chat} live={live} t={t} scrollRef={listRef} />

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
        {loading ? (
          <button
            type="button"
            onClick={stop}
            className="inline-flex min-h-[44px] items-center justify-center rounded-pill border border-line px-5 py-2 text-sm font-semibold text-ink-muted transition-colors duration-200 hover:border-ink hover:text-ink"
          >
            {t.workspace.stop}
          </button>
        ) : null}
      </form>
    </div>
  );
}
