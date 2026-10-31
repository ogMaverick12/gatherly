'use client';

/**
 * State and request steps for the assistant conversation controller.
 */

import { useRef, useState, type RefObject } from 'react';
import { buildBasicAnswer, classifyIntent, renderSnapshotForModel } from '@/features/assistant';
import type { Dictionary } from '@/lib/i18n';
import type { ChatMessage } from '@/lib/plan';
import type { PlanView } from '../plan-view';
import {
  applyFrame,
  emptyAnswer,
  readEventStream,
  type StreamedAnswer,
} from '../components/assistant-stream';
import { newMessage } from './assistant-chat-message';

/** The state and refs one assistant conversation owns. */
export function useChatState() {
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState<StreamedAnswer | null>(null);
  const [notices, setNotices] = useState<readonly string[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  return {
    draft,
    loading,
    live,
    notices,
    abortRef,
    listRef,
    setDraft,
    setLoading,
    setLive,
    setNotices,
  };
}

/** The assistant conversation state held by the workspace controller. */
export type ChatState = ReturnType<typeof useChatState>;

/** Scroll the message list to its end after the next paint. */
function scrollToEnd(listRef: RefObject<HTMLDivElement | null>) {
  // `scrollTop` rather than `scrollTo`: it is the one form every environment
  // this panel is rendered in supports, the test DOM included.
  window.setTimeout(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, 40);
}

/** The request body the chat route expects. */
function buildChatBody(message: string, view: PlanView) {
  return {
    message,
    planSummary: renderSnapshotForModel(view.snapshot),
    snapshot: view.snapshot,
  };
}

/** Stream one answer, reporting each frame and returning the final answer. */
async function streamAnswer(
  message: string,
  view: PlanView,
  signal: AbortSignal,
  onFrame: (answer: StreamedAnswer) => void,
): Promise<StreamedAnswer> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildChatBody(message, view)),
    signal,
  });
  if (!response.ok) throw new Error('chat_failed');
  let answer = emptyAnswer();
  await readEventStream(response, (frame) => {
    answer = applyFrame(answer, frame);
    onFrame(answer);
  });
  return answer;
}

/** The answer kept when the person stops a stream. */
function stoppedAnswer(answer: StreamedAnswer, t: Dictionary): StreamedAnswer {
  return { ...answer, notices: [...answer.notices, t.workspace.stopped] };
}

/** The local Basic answer used when the route is unavailable. */
function offlineAnswer(
  answer: StreamedAnswer,
  message: string,
  view: PlanView,
  t: Dictionary,
): StreamedAnswer {
  return {
    mode: answer.content ? answer.mode : 'basic',
    content: answer.content || buildBasicAnswer(classifyIntent(message), view.snapshot),
    notices: [t.errors.offline],
    interrupted: false,
  };
}

/** Start one ask: clear the composer, show the user turn and open the stream. */
function beginAsk(trimmed: string, onSend: (message: ChatMessage) => void, chat: ChatState) {
  chat.setDraft('');
  chat.setLoading(true);
  chat.setNotices([]);
  onSend(newMessage('user', trimmed, null));
  const answer = emptyAnswer();
  chat.setLive(answer);
  const controller = new AbortController();
  chat.abortRef.current = controller;
  return { answer, controller };
}

/** Finish one ask: keep the final answer, close the live slot and scroll. */
function finishAsk(
  answer: StreamedAnswer,
  onSend: (message: ChatMessage) => void,
  chat: ChatState,
) {
  chat.abortRef.current = null;
  chat.setNotices(answer.notices);
  chat.setLive(null);
  chat.setLoading(false);
  if (answer.content.trim().length > 0) {
    onSend(newMessage('assistant', answer.content, answer.mode));
  }
  scrollToEnd(chat.listRef);
}

/** Everything one ask needs from the conversation. */
interface AskRun {
  readonly text: string;
  readonly view: PlanView;
  readonly onSend: (message: ChatMessage) => void;
  readonly t: Dictionary;
  readonly chat: ChatState;
}

/** Run one ask to completion, choosing the stopped or offline answer on failure. */
async function runAsk({ text, view, onSend, t, chat }: AskRun): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed || chat.loading) return;
  const started = beginAsk(trimmed, onSend, chat);
  let answer = started.answer;
  const controller = started.controller;
  try {
    answer = await streamAnswer(trimmed, view, controller.signal, (next) => {
      answer = next;
      chat.setLive(next);
      chat.setNotices(next.notices);
    });
  } catch {
    answer = controller.signal.aborted
      ? stoppedAnswer(answer, t)
      : offlineAnswer(answer, trimmed, view, t);
  }
  finishAsk(answer, onSend, chat);
}

/** Build the ask action for one conversation. */
export function useChatAsk(
  view: PlanView,
  onSend: (message: ChatMessage) => void,
  t: Dictionary,
  chat: ChatState,
) {
  return (text: string) => runAsk({ text, view, onSend, t, chat });
}

/** Build the stop action for one conversation. */
export function useChatStop(abortRef: RefObject<AbortController | null>) {
  return () => {
    abortRef.current?.abort();
  };
}
