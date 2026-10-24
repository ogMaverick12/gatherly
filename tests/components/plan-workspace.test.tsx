import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlanWorkspace } from '@/features/workspace/components/PlanWorkspace';
import { getPlan, setPlan } from '@/lib/plan-store';
import { makePlan, renderWithProvider } from '../helpers';

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('the plan workspace', () => {
  it('offers to start a plan when there is none', () => {
    setPlan(null);
    renderWithProvider(<PlanWorkspace />);
    expect(screen.getByRole('heading', { name: 'There is no plan yet.' })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Create one' }).length).toBeGreaterThan(0);
  });

  it('shows the plan when there is one', async () => {
    setPlan(makePlan());
    renderWithProvider(<PlanWorkspace />);
    expect(await screen.findByRole('heading', { name: /120 guests/ })).toBeInTheDocument();
  });

  it('seeds the plan with the generated milestones', async () => {
    setPlan(makePlan());
    renderWithProvider(<PlanWorkspace />);
    await waitFor(() => {
      expect(getPlan()?.milestones.length).toBeGreaterThan(0);
    });
  });

  it('switches to the budget tab', async () => {
    const user = userEvent.setup();
    setPlan(makePlan());
    renderWithProvider(<PlanWorkspace />);

    await user.click(screen.getByRole('tab', { name: 'Budget' }));
    expect(
      await screen.findByRole('heading', { name: 'Where the money goes' }),
    ).toBeInTheDocument();
  });

  it('switches to the timeline tab and ticks a milestone', async () => {
    const user = userEvent.setup();
    setPlan(makePlan());
    renderWithProvider(<PlanWorkspace />);

    await user.click(screen.getByRole('tab', { name: /Timeline/ }));
    const milestone = await screen.findByText('Shortlist venues and hold the best one');
    await user.click(milestone.closest('label') as HTMLElement);

    await waitFor(() => {
      const stored = getPlan()?.milestones.find((item) => item.id === 'venue-shortlist');
      expect(stored?.done).toBe(true);
    });
  });

  it('ticks a task off in the overview', async () => {
    const user = userEvent.setup();
    const plan = makePlan();
    setPlan({
      ...plan,
      tasks: [{ id: 't1', title: 'Book the photographer', done: false, area: 'vendors' }],
    });
    renderWithProvider(<PlanWorkspace />);

    const task = await screen.findByText('Book the photographer');
    await user.click(task.closest('label') as HTMLElement);

    await waitFor(() => {
      expect(getPlan()?.tasks[0]?.done).toBe(true);
    });
  });

  it('adds a vendor from the vendors tab', async () => {
    const user = userEvent.setup();
    setPlan(makePlan());
    renderWithProvider(<PlanWorkspace />);

    await user.click(screen.getByRole('tab', { name: 'Vendors' }));
    const addButtons = await screen.findAllByRole('button', { name: 'Add a vendor' });
    await user.click(addButtons[0] as HTMLElement);

    await waitFor(() => {
      expect(getPlan()?.vendors.length).toBe(1);
    });
  });

  it('clears the plan after a confirmation', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.fn().mockReturnValue(true);
    vi.stubGlobal('confirm', confirmSpy);
    setPlan(makePlan());
    renderWithProvider(<PlanWorkspace />);

    await user.click(screen.getByRole('button', { name: 'Start over' }));
    expect(confirmSpy).toHaveBeenCalled();
    expect(getPlan()).toBeNull();
    vi.unstubAllGlobals();
  });
});
