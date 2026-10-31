import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CelebrationDot,
  HealthRail,
  MilestoneList,
  OverviewPanel,
  CateringSummary,
  RiskList,
  StatCard,
  WorkspaceHeader,
} from '@/features/workspace';
import { DICTIONARIES } from '@/lib/i18n';
import type { PlanView } from '@/features/workspace';
import { makeView, renderWithProvider } from '../helpers';

const t = DICTIONARIES.en;

function withIntake(view: PlanView, patch: Partial<PlanView['plan']['intake']>): PlanView {
  return { ...view, plan: { ...view.plan, intake: { ...view.plan.intake, ...patch } } };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('the health rail', () => {
  it('shows each band, including the quiet states', () => {
    const base = makeView();
    const { rerender } = renderWithProvider(
      <HealthRail view={{ ...base, health: { ...base.health, band: 'attention' } }} />,
    );
    expect(screen.getByText('Worth attention')).toBeInTheDocument();

    const quiet = withIntake(
      {
        ...base,
        health: { ...base.health, band: 'on_track', nextAction: null },
      },
      { eventDate: null, guests: 0 },
    );
    rerender(<HealthRail view={quiet} />);
    expect(screen.getByText('On track')).toBeInTheDocument();
    expect(screen.getByText(t.common.unknown)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: t.workspace.nextUp })).not.toBeInTheDocument();

    rerender(<HealthRail view={{ ...base, health: { ...base.health, band: 'at_risk' } }} />);
    expect(screen.getByText('At risk')).toBeInTheDocument();
  });
});

describe('the workspace header', () => {
  it('asks before clearing and handles a plan without a date', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const base = makeView();
    const view = withIntake(base, { eventDate: null, guests: 0 });
    const { rerender } = renderWithProvider(
      <WorkspaceHeader view={view} plan={view.plan} onClear={onClear} />,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('0 guests');
    await user.click(screen.getByRole('button', { name: t.workspace.clearPlan }));
    expect(onClear).not.toHaveBeenCalled();

    confirm.mockReturnValue(true);
    rerender(<WorkspaceHeader view={base} plan={base.plan} onClear={onClear} />);
    await user.click(screen.getByRole('button', { name: t.workspace.clearPlan }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe('the overview panel fallbacks', () => {
  it('explains an estimate, an unset date and an overdue plan', () => {
    const base = makeView();
    const plan = {
      ...base.plan,
      intake: { ...base.plan.intake, eventDate: null, guestCountIsEstimate: true },
      tasks: [],
    };
    const view: PlanView = {
      ...base,
      plan,
      timeline: { ...base.timeline, daysToEvent: null, overdue: 1 },
      coverage: { ...base.coverage, nextAction: null },
    };
    renderWithProvider(<OverviewPanel view={view} onToggleTask={() => undefined} />);
    expect(screen.getByText(t.intake.guestCountIsEstimate)).toBeInTheDocument();
    expect(screen.getByText(t.common.unknown)).toBeInTheDocument();
    expect(screen.getByText('1 overdue')).toBeInTheDocument();
    expect(screen.getAllByText(t.workspace.vendorsChecklist).length).toBeGreaterThan(0);
    expect(screen.getByText(t.workspace.noPlanCta)).toBeInTheDocument();
  });

  it('renders the quiet variants of the smaller sections', () => {
    const base = makeView();
    renderWithProvider(<StatCard label="Guests" value="10" />);
    expect(screen.getByText('Guests')).toBeInTheDocument();

    renderWithProvider(
      <MilestoneList
        view={{ ...base, milestones: [] }}
        today="2026-10-22"
        t={t}
        onToggleMilestone={() => undefined}
      />,
    );
    expect(screen.getByText(t.intake.dateNotSet)).toBeInTheDocument();

    renderWithProvider(<CateringSummary catering={{ ...base.catering, dietary: [] }} />);
    expect(screen.getByText('Plates')).toBeInTheDocument();

    renderWithProvider(
      <CateringSummary
        catering={{
          ...base.catering,
          dietary: [
            {
              need: 'vegetarian',
              label: 'Vegetarian',
              action: 'Confirm in writing.',
              confirmed: true,
            },
          ],
        }}
      />,
    );
    expect(screen.getByText('Vegetarian')).toBeInTheDocument();

    renderWithProvider(
      <RiskList
        risks={[
          {
            id: 'quiet',
            severity: 'low',
            area: 'planning',
            title: 'A quiet risk',
            explanation: 'Nothing urgent.',
            mitigation: 'Keep an eye on it.',
          },
        ]}
      />,
    );
    expect(screen.getByText('A quiet risk')).toBeInTheDocument();

    renderWithProvider(<CelebrationDot status="neutral" />);
    expect(document.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });
});
