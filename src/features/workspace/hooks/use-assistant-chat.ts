'use client';

/**
 * The assistant conversation controller.
 * It streams answers, falls back to a Basic answer offline and exposes stop.
 */

import type { RefObject } from 'react';
import { useAccessibility } from '@/features/accessibility';
import type { ChatMessage } from '@/lib/plan';
import type { PlanView } from '../plan-view';
import type { StreamedAnswer } from '../components/assistant-stream';
import { useChatAsk, useChatState, useChatStop } from './assistant-chat-controller';

export { newMessage } from './assistant-chat-message';

export interface AssistantChat {
  readonly draft: string;
  readonly loading: boolean;
  readonly live: StreamedAnswer | null;
  readonly notices: readonly string[];
  readonly listRef: RefObject<HTMLDivElement | null>;
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
 */
export function useAssistantChat(
  view: PlanView,
  onSend: (message: ChatMessage) => void,
): AssistantChat {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const chat = useChatState();
  const ask = useChatAsk(view, onSend, t, chat);
  const stop = useChatStop(chat.abortRef);
  return {
    draft: chat.draft,
    loading: chat.loading,
    live: chat.live,
    notices: chat.notices,
    listRef: chat.listRef,
    setDraft: chat.setDraft,
    ask,
    stop,
  };
}
