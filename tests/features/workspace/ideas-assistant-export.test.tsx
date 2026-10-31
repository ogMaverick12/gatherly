import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IdeasPanel, AssistantPanel, ExportBar, SharedPlanPrompt } from '@/features/workspace';
import { getPlan, setPlan } from '@/lib/plan-store';
import type { ChatMessage, Idea } from '@/lib/plan';
import { encodeShareFragment } from '@/lib/share';
import { makePlan, makeView, renderWithProvider } from '@tests/support/helpers';

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const IDENTITY_QUESTION = 'How much is the food?';

describe('the ideas panel', () => {
  beforeEach(() => {
    setPlan(null);
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              mode: 'basic',
              ideas: [
                {
                  id: 'idea-1',
                  title: 'Ask for a second tasting',
                  body: 'Two plates for the table.',
                  rationale: 'You have 120 guests.',
                  costImpactMinor: null,
                  tags: ['food'],
                  source: 'basic',
                },
              ],
              notices: ['Basic mode is on.'],
            }),
            { status: 200 },
          ),
      ),
    );
  });

  it('shows the Basic mode badge', () => {
    renderWithProvider(
      <IdeasPanel view={makeView()} onApplyIdea={vi.fn()} onStoreIdeas={vi.fn()} />,
    );
    expect(screen.getByText('Basic mode')).toBeInTheDocument();
  });

  it('refreshes the ideas and keeps the Basic mode badge', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <IdeasPanel view={makeView()} onApplyIdea={vi.fn()} onStoreIdeas={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: 'Refresh ideas' }));

    expect(await screen.findByText('Ask for a second tasting')).toBeInTheDocument();
    expect(screen.getByText('Basic mode')).toBeInTheDocument();
  });

  it('does not change the plan until the user applies an idea', async () => {
    const user = userEvent.setup();
    setPlan(makePlan());
    const view = makeView();
    const onApplyIdea = vi.fn();

    renderWithProvider(<IdeasPanel view={view} onApplyIdea={onApplyIdea} onStoreIdeas={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Refresh ideas' }));
    await screen.findByText('Ask for a second tasting');

    expect(onApplyIdea).not.toHaveBeenCalled();
    expect(getPlan()?.tasks).toHaveLength(makePlan().tasks.length);

    await user.click(screen.getByRole('button', { name: 'Apply to the plan' }));

    expect(onApplyIdea).toHaveBeenCalledOnce();
    expect(getPlan()?.tasks).toHaveLength(makePlan().tasks.length);
  });

  it('says when the route cannot be reached', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );

    renderWithProvider(
      <IdeasPanel view={makeView()} onApplyIdea={vi.fn()} onStoreIdeas={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: 'Refresh ideas' }));

    expect(await screen.findByText(/offline/i)).toBeInTheDocument();
  });
});

describe('the assistant panel', () => {
  beforeEach(() => {
    setPlan(null);
  });

  it('answers with the Basic mode badge', async () => {
    const user = userEvent.setup();
    const messages: ChatMessage[] = [];
    const sse = [
      'event: mode\ndata: {"provider":"basic","live":false}\n\n',
      'event: delta\ndata: {"text":"Food is 28% of the budget."}\n\n',
      'event: done\ndata: {"mode":"basic","notices":[]}\n\n',
    ].join('');

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(sse, {
            status: 200,
            headers: { 'Content-Type': 'text/event-stream' },
          }),
      ),
    );

    renderWithProvider(
      <AssistantPanel
        view={makeView()}
        onSend={(message) => {
          messages.push(message);
        }}
      />,
    );

    await user.type(screen.getByRole('textbox'), IDENTITY_QUESTION);
    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(messages).toHaveLength(2);
    });
    expect(messages[1]?.content).toBe('Food is 28% of the budget.');
    expect(messages[1]?.mode).toBe('basic');
  });

  it('answers locally when the route cannot be reached', async () => {
    const user = userEvent.setup();
    const messages: ChatMessage[] = [];

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('offline');
      }),
    );

    renderWithProvider(
      <AssistantPanel
        view={makeView()}
        onSend={(message) => {
          messages.push(message);
        }}
      />,
    );

    await user.type(screen.getByRole('textbox'), IDENTITY_QUESTION);
    await user.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(messages).toHaveLength(2);
    });
    expect(messages[1]?.mode).toBe('basic');
    expect(messages[1]?.content.length).toBeGreaterThan(0);
  });
});

describe('the export bar', () => {
  beforeEach(() => {
    setPlan(null);
  });

  it('prints the plan', async () => {
    const user = userEvent.setup();
    const print = vi.fn();
    vi.stubGlobal('print', print);

    renderWithProvider(<ExportBar view={makeView()} />);
    await user.click(screen.getByRole('button', { name: 'Print or save as PDF' }));

    expect(print).toHaveBeenCalledOnce();
  });

  it('downloads the budget as a CSV', async () => {
    const user = userEvent.setup();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    renderWithProvider(<ExportBar view={makeView()} />);
    await user.click(screen.getByRole('button', { name: 'Export the budget as CSV' }));

    expect(click).toHaveBeenCalledOnce();
    click.mockRestore();
  });

  it('copies a share link and says so', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(async (_text: string) => undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    renderWithProvider(<ExportBar view={makeView()} />);
    await user.click(screen.getByRole('button', { name: 'Copy a share link' }));

    expect(writeText).toHaveBeenCalledOnce();
    expect(String(writeText.mock.calls[0]?.[0])).toContain('#g1');
  });

  it('refuses a file that is not a plan', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ExportBar view={makeView()} />);
    const input = screen.getByLabelText('Restore from a file');

    // jsdom's File has no `text()`, so the reader the browser would give
    // us is added here.
    const file = new File(['{"not":"a plan"}'], 'plan.json', {
      type: 'application/json',
    });
    Object.defineProperty(file, 'text', {
      value: async () => '{"not":"a plan"}',
    });

    await user.upload(input, file);

    expect(await screen.findByText('Please check the highlighted answers.')).toBeInTheDocument();
  });
});

describe('the shared plan prompt', () => {
  it('offers to open the plan in the link', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    renderWithProvider(<SharedPlanPrompt onOpen={onOpen} />);

    const button = screen.getByRole('button', { name: 'Open a shared plan from this link' });
    await user.click(button);

    // Nothing in the fragment, so nothing is offered.
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('reads the plan out of the fragment and asks before replacing', async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    const fragment = await encodeShareFragment(makePlan());
    window.location.hash = `#${fragment}`;

    try {
      renderWithProvider(<SharedPlanPrompt onOpen={onOpen} />);
      await user.click(screen.getByRole('button', { name: 'Open a shared plan from this link' }));

      expect(await screen.findByText(/A shared plan was found in this link/)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Open the shared plan' }));
      expect(onOpen).toHaveBeenCalledOnce();
      expect(onOpen.mock.calls[0]?.[0]).toMatchObject({ intake: { guests: 120 } });
    } finally {
      window.location.hash = '';
    }
  });

  it('can be dismissed', async () => {
    const user = userEvent.setup();
    const fragment = await encodeShareFragment(makePlan());
    window.location.hash = `#${fragment}`;

    try {
      renderWithProvider(<SharedPlanPrompt onOpen={vi.fn()} />);
      await user.click(screen.getByRole('button', { name: 'Open a shared plan from this link' }));
      await screen.findByText(/A shared plan was found in this link/);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(screen.queryByText(/A shared plan was found in this link/)).not.toBeInTheDocument();
    } finally {
      window.location.hash = '';
    }
  });
});

describe('the idea model', () => {
  it('carries a source', () => {
    const idea: Idea = {
      id: 'x',
      title: 't',
      body: 'b',
      rationale: 'r',
      costImpactMinor: null,
      tags: [],
      source: 'basic',
    };
    expect(idea.source).toBe('basic');
  });
});
