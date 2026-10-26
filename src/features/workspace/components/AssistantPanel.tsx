'use client';

import { useAccessibility } from '@/features/accessibility/provider';
import type { ChatMessage } from '@/lib/plan';
import type { PlanView } from '@/lib/plan-view';
import { useAssistantChat } from '../hooks/use-assistant-chat';
import { AssistantComposer } from './AssistantComposer';
import { AssistantLog } from './AssistantLog';

/** The assistant tab: the ground it answers from, the log, and the question box. */
export function AssistantPanel({
  view,
  onSend,
}: {
  view: PlanView;
  onSend: (message: ChatMessage) => void;
}) {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const chat = useAssistantChat(view, onSend);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-title">{t.workspace.assistantTitle}</h2>
        <p className="mt-1 text-sm text-ink-muted">{t.workspace.assistantHelp}</p>
      </div>

      <AssistantLog messages={view.plan.chat} live={chat.live} t={t} scrollRef={chat.listRef} />

      {chat.notices.length > 0 ? (
        <ul role="status" className="space-y-1 text-sm text-ink-muted">
          {chat.notices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
        </ul>
      ) : null}

      <p className="rounded-card border border-line bg-paper p-3 text-xs text-ink-muted">
        {t.workspace.basicModeHelp}
      </p>

      <AssistantComposer
        draft={chat.draft}
        loading={chat.loading}
        onDraftChange={chat.setDraft}
        onAsk={() => void chat.ask(chat.draft)}
        onStop={chat.stop}
      />
    </div>
  );
}
