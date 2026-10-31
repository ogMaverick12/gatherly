import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  OverviewPanel,
  BudgetPanel,
  TimelinePanel,
  VendorsPanel,
  IdeasPanel,
  AssistantPanel,
  HealthRail,
  ExportBar,
} from '@/features/workspace';
import { makePlan, makeView, renderWithProvider } from '@tests/support/helpers';

const downloadFile = vi.fn();
const copyToClipboard = vi.fn();

vi.mock('@/lib/download', () => ({
  downloadFile: (...args: unknown[]) => downloadFile(...args),
  copyToClipboard: (...args: unknown[]) => copyToClipboard(...args),
}));

beforeEach(() => {
  downloadFile.mockReset();
  copyToClipboard.mockReset();
  copyToClipboard.mockResolvedValue(true);
});

describe('the overview panel', () => {
  it('shows the headline numbers', () => {
    renderWithProvider(<OverviewPanel view={makeView()} onToggleTask={() => undefined} />);
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('Plan health')).toBeInTheDocument();
  });

  it('lists the risks with their mitigations', () => {
    renderWithProvider(<OverviewPanel view={makeView()} onToggleTask={() => undefined} />);
    expect(screen.getByRole('heading', { name: 'Worth watching' })).toBeInTheDocument();
    expect(screen.getByText(/No venue booked yet/)).toBeInTheDocument();
  });

  it('ticks a task off', async () => {
    const user = userEvent.setup();
    const onToggleTask = vi.fn();
    const view = makeView();
    const plan = {
      ...view.plan,
      tasks: [
        {
          id: 't1',
          title: 'Confirm the ceremony and reception venues',
          done: false,
          area: 'vendors' as const,
        },
      ],
    };
    renderWithProvider(<OverviewPanel view={{ ...view, plan }} onToggleTask={onToggleTask} />);
    const task = screen.getByText('Confirm the ceremony and reception venues');
    await user.click(task.closest('label') as HTMLElement);
    expect(onToggleTask).toHaveBeenCalled();
  });
});

describe('the budget panel', () => {
  it('shows the arithmetic for every category', () => {
    renderWithProvider(<BudgetPanel view={makeView()} />);
    const table = screen.getByRole('table');
    expect(within(table).getByText('Food & drink')).toBeInTheDocument();
    expect(within(table).getByText('Base share')).toBeInTheDocument();
    expect(within(table).getByText('Typical')).toBeInTheDocument();
  });

  it('shows the contingency and the total', () => {
    renderWithProvider(<BudgetPanel view={makeView()} />);
    const table = screen.getByRole('table');
    expect(within(table).getByText('Contingency')).toBeInTheDocument();
    expect(within(table).getByText('Budget')).toBeInTheDocument();
  });

  it('lists the what-if scenarios', () => {
    renderWithProvider(<BudgetPanel view={makeView()} />);
    expect(screen.getByRole('heading', { name: 'What if' })).toBeInTheDocument();
    expect(screen.getByText('25% more guests')).toBeInTheDocument();
  });

  it('shows the warnings', () => {
    renderWithProvider(<BudgetPanel view={makeView()} />);
    expect(screen.getByRole('heading', { name: 'Things to check' })).toBeInTheDocument();
  });
});

describe('the timeline panel', () => {
  it('lists the milestones with their reasons', () => {
    renderWithProvider(<TimelinePanel view={makeView()} onToggleMilestone={() => undefined} />);
    expect(screen.getByRole('heading', { name: 'Milestones' })).toBeInTheDocument();
    expect(screen.getByText('Shortlist venues and hold the best one')).toBeInTheDocument();
  });

  it('ticks a milestone off', async () => {
    const user = userEvent.setup();
    const onToggleMilestone = vi.fn();
    renderWithProvider(<TimelinePanel view={makeView()} onToggleMilestone={onToggleMilestone} />);
    await user.click(
      screen.getByText('Shortlist venues and hold the best one').closest('label') as HTMLElement,
    );
    expect(onToggleMilestone).toHaveBeenCalledWith('venue-shortlist');
  });

  it('shows the run of show', () => {
    renderWithProvider(<TimelinePanel view={makeView()} onToggleMilestone={() => undefined} />);
    expect(screen.getByRole('heading', { name: 'Run of show' })).toBeInTheDocument();
    expect(screen.getByText('Ceremony')).toBeInTheDocument();
  });
});

describe('the vendors panel', () => {
  it('shows the coverage for every category', () => {
    renderWithProvider(
      <VendorsPanel
        view={makeView()}
        onUpdateVendor={() => undefined}
        onAddVendor={() => undefined}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Coverage' })).toBeInTheDocument();
  });

  it('adds a vendor from the form', async () => {
    const user = userEvent.setup();
    const onAddVendor = vi.fn();
    renderWithProvider(
      <VendorsPanel view={makeView()} onUpdateVendor={() => undefined} onAddVendor={onAddVendor} />,
    );
    await user.click(screen.getAllByRole('button', { name: 'Add a vendor' })[0] as HTMLElement);
    expect(onAddVendor).toHaveBeenCalled();
  });

  it('changes a vendor status', async () => {
    const user = userEvent.setup();
    const onUpdateVendor = vi.fn();
    const view = makeView();
    const plan = {
      ...view.plan,
      vendors: [
        {
          id: 'v1',
          category: 'caterer' as const,
          name: 'Sharma Caterers',
          status: 'to_contact' as const,
          quotedMinor: null,
          depositMinor: null,
          dueDate: null,
          phone: '',
          notes: '',
        },
      ],
    };
    renderWithProvider(
      <VendorsPanel
        view={{ ...view, plan }}
        onUpdateVendor={onUpdateVendor}
        onAddVendor={() => undefined}
      />,
    );
    const select = screen.getAllByLabelText('Status')[0] as HTMLSelectElement;
    await user.selectOptions(select, 'booked');
    expect(onUpdateVendor).toHaveBeenCalled();
  });
});

describe('the ideas panel', () => {
  it('shows the deterministic ideas and labels the mode', () => {
    renderWithProvider(
      <IdeasPanel view={makeView()} onApplyIdea={() => undefined} onStoreIdeas={() => undefined} />,
    );
    expect(screen.getByText('Basic mode')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ideas for this plan' })).toBeInTheDocument();
  });

  it('applies an idea as a task when the user asks', async () => {
    const user = userEvent.setup();
    const onApplyIdea = vi.fn();
    renderWithProvider(
      <IdeasPanel view={makeView()} onApplyIdea={onApplyIdea} onStoreIdeas={() => undefined} />,
    );
    await user.click(
      screen.getAllByRole('button', { name: 'Apply to the plan' })[0] as HTMLElement,
    );
    expect(onApplyIdea).toHaveBeenCalled();
    expect(screen.getAllByText('Applied').length).toBeGreaterThan(0);
  });
});

describe('the assistant panel', () => {
  it('shows the deterministic answer when the route cannot be reached', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const onSend = vi.fn();
    renderWithProvider(<AssistantPanel view={makeView()} onSend={onSend} />);

    await user.type(
      screen.getByRole('textbox', { name: 'Ask about your plan' }),
      'what should I do next',
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSend).toHaveBeenCalledTimes(2);
    const answer = onSend.mock.calls[1]?.[0] as { content: string; mode: string };
    expect(answer.mode).toBe('basic');
    expect(answer.content.length).toBeGreaterThan(0);
    vi.unstubAllGlobals();
  });

  it('does not send an empty question', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderWithProvider(<AssistantPanel view={makeView()} onSend={onSend} />);
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSend).not.toHaveBeenCalled();
  });
});

describe('the health rail', () => {
  it('shows the score, the next action and the formula', () => {
    renderWithProvider(<HealthRail view={makeView()} />);
    expect(screen.getByRole('heading', { name: 'Plan health' })).toBeInTheDocument();
    expect(screen.getByText('How it is calculated')).toBeInTheDocument();
  });

  it('lists the parts and their weights', () => {
    renderWithProvider(<HealthRail view={makeView()} />);
    expect(screen.getByText('Budget shape')).toBeInTheDocument();
    expect(screen.getAllByText(/25%/).length).toBeGreaterThan(0);
  });
});

describe('the export bar', () => {
  it('discloses the actions from a single keyboard-operable control', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ExportBar view={makeView()} />);
    const toggle = screen.getByRole('button', { name: 'Export' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('prints the plan', async () => {
    const user = userEvent.setup();
    const print = vi.fn();
    vi.stubGlobal('print', print);
    renderWithProvider(<ExportBar view={makeView()} />);
    await user.click(screen.getByRole('button', { name: 'Print or save as PDF' }));
    expect(print).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('downloads a calendar file', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ExportBar view={makeView()} />);
    await user.click(screen.getByRole('button', { name: 'Add to a calendar' }));
    expect(downloadFile).toHaveBeenCalledWith(
      'gatherly-plan.ics',
      expect.stringContaining('BEGIN:VCALENDAR'),
      'text/calendar',
    );
  });

  it('downloads the budget as CSV', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ExportBar view={makeView()} />);
    await user.click(screen.getByRole('button', { name: 'Export the budget as CSV' }));
    expect(downloadFile).toHaveBeenCalledWith(
      'gatherly-budget.csv',
      expect.stringContaining('Category'),
      'text/csv',
    );
  });

  it('copies a share link that never leaves the browser', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ExportBar view={makeView()} />);
    await user.click(screen.getByRole('button', { name: 'Copy a share link' }));
    expect(copyToClipboard).toHaveBeenCalled();
    expect(
      await screen.findByText('Share link copied. It never leaves your browser.'),
    ).toBeInTheDocument();
  });

  it('downloads the plan as JSON', async () => {
    const user = userEvent.setup();
    renderWithProvider(<ExportBar view={makeView()} />);
    await user.click(screen.getByRole('button', { name: 'Download the plan as JSON' }));
    expect(downloadFile).toHaveBeenCalledWith(
      'gatherly-plan.json',
      expect.stringContaining('"version"'),
      'application/json',
    );
  });
});

describe('the plan used by the panels', () => {
  it('is a valid plan', () => {
    const plan = makePlan();
    expect(plan.intake.guests).toBe(120);
  });
});
