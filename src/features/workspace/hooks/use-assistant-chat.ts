'use client';

/**
 * The assistant conversation controller.
 * It streams answers, falls back to a Basic answer offline and exposes stop.
 */

import { useRef, useState } from 'react';
import { useAccessibility } from '@/features/accessibility/provider';
import {
  buildBasicAnswer,
  classifyIntent,
  renderSnapshotForModel,
} from '@/features/assistant/services';
import type { ChatMessage } from '@/lib/plan';
import type { PlanView } from '@/lib/plan-view';
import {
  applyFrame,
  emptyAnswer,
  readEventStream,
  type Mode,
  type StreamedAnswer,
} from '../components/assistant-stream';

/** A chat message with the id and timestamp the log expects. */
export function newMessage(
  role: ChatMessage['role'],
  content: string,
  mode: Mode | null,
): ChatMessage {
  const stamp = Date.now().toString(36);
  return {
    id: `chat_${role}_${stamp}`,
    role,
    content,
    mode,
    createdAt: new Date().toISOString(),
  };
}

export interface AssistantChat {
  readonly draft: string;
  readonly loading: boolean;
  readonly live: StreamedAnswer | null;
  readonly notices: readonly string[];
  readonly listRef: React.RefObject<HTMLDivElement | null>;
  setDraft(value: string): void;
  ask(text: string): Promise<void>;
  stop(): void;
}

/**
 * One conversation with the assistant.
 *
 * The answer is streamed into `live` as frames arrive, so the person can read
 * it while it is being written and stop it if it is not what they wanted. If
 * the route is unreachable the same deterministic rules answer locally, and
 * the notice says the mode rather than hiding it.
 * long-function: one controller: the abort, the local fallback and the notice are the same state transition.
 */
export function useAssistantChat(
  view: PlanView,
  onSend: (message: ChatMessage) => void,
): AssistantChat {
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

  return { draft, loading, live, notices, listRef, setDraft, ask, stop };
}
