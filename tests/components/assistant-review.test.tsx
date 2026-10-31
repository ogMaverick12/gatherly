import { describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { screen } from '@testing-library/react';
import { AssistantLog, BudgetWarnings } from '@/features/workspace';
import { ReviewSummary } from '@/features/intake';
import { DEFAULT_INTAKE_VALUES, type IntakeFormValues } from '@/features/intake';
import { DICTIONARIES } from '@/lib/i18n';
import type { ChatMessage } from '@/lib/plan';
import { renderWithProvider } from '../helpers';

const t = DICTIONARIES.en;

function message(patch: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'm1',
    role: 'assistant',
    content: 'Ask me anything.',
    mode: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...patch,
  };
}

describe('the assistant log', () => {
  it('shows the placeholder when the conversation is empty', () => {
    renderWithProvider(
      <AssistantLog messages={[]} live={null} t={t} scrollRef={createRef<HTMLDivElement>()} />,
    );
    expect(screen.getByText(t.workspace.assistantPlaceholder)).toBeInTheDocument();
    expect(screen.getByRole('log')).toHaveAttribute('aria-busy', 'false');
  });

  it('labels stored and streaming answers by mode', () => {
    const { rerender } = renderWithProvider(
      <AssistantLog
        messages={[
          message({ id: 'u1', role: 'user', content: 'Hello', mode: null }),
          message({ id: 'a1', content: 'Hi', mode: 'basic' }),
          message({ id: 'a2', content: 'Hello again', mode: 'provider' }),
        ]}
        live={null}
        t={t}
        scrollRef={createRef<HTMLDivElement>()}
      />,
    );
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText(t.workspace.basicMode)).toBeInTheDocument();
    expect(screen.getByText(t.workspace.providerMode)).toBeInTheDocument();

    rerender(
      <AssistantLog
        messages={[]}
        live={{ mode: 'basic', content: 'Still writing', notices: [], interrupted: false }}
        t={t}
        scrollRef={createRef<HTMLDivElement>()}
      />,
    );
    expect(screen.getByText('Still writing')).toBeInTheDocument();
    expect(screen.getByTestId('assistant-stream')).toHaveAttribute('aria-live', 'off');
    expect(screen.getByText(t.workspace.basicMode)).toBeInTheDocument();
  });
});

describe('the review summary', () => {
  it('handles a date that is not decided and no priorities', () => {
    renderWithProvider(
      <ReviewSummary values={DEFAULT_INTAKE_VALUES} currency="INR" budget={500_000} />,
    );
    expect(screen.getByText(t.intake.dateNotSet)).toBeInTheDocument();
    expect(screen.getByText(t.common.none)).toBeInTheDocument();
  });

  it('shows the chosen date and priorities', () => {
    const values: IntakeFormValues = {
      ...DEFAULT_INTAKE_VALUES,
      eventDate: '2026-12-05',
      dateNotSet: false,
      priorities: ['food', 'photography'],
    };
    renderWithProvider(<ReviewSummary values={values} currency="INR" budget={500_000} />);
    expect(screen.getByText('2026-12-05')).toBeInTheDocument();
    expect(screen.getByText('Food & drink, Photography & film')).toBeInTheDocument();
  });
});

describe('the budget warnings', () => {
  it('explains an empty list and every severity', () => {
    const { rerender } = renderWithProvider(<BudgetWarnings warnings={[]} />);
    expect(screen.getByText(t.workspace.noWarnings)).toBeInTheDocument();

    rerender(
      <BudgetWarnings
        warnings={[
          { id: 'w1', severity: 'attention', title: 'Food is high', detail: 'It is 41%.' },
          { id: 'w2', severity: 'info', title: 'A note', detail: 'Nothing urgent.' },
        ]}
      />,
    );
    expect(screen.getByText('Food is high')).toBeInTheDocument();
    expect(screen.getByText('A note')).toBeInTheDocument();
  });
});
