import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { createPlan } from '@/lib/plan';
import { TEST_INTAKE } from '../helpers';

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

/**
 * A page reload drops the JavaScript module state and keeps only what is in
 * local storage. The workspace has to pick the plan back up on its own.
 */
describe('restoring a plan after a reload', () => {
  beforeEach(() => {
    vi.resetModules();
    window.localStorage.clear();
  });

  it('shows the stored plan without any user action', async () => {
    const plan = createPlan(TEST_INTAKE, new Date('2026-01-01T00:00:00.000Z'));
    window.localStorage.setItem('gatherly:plan:v1', JSON.stringify(plan));

    const { PlanWorkspace } = await import('@/features/workspace');
    const { renderWithProvider } = await import('../helpers');
    renderWithProvider(<PlanWorkspace />);

    expect(await screen.findByRole('heading', { name: /120 guests/ })).toBeInTheDocument();
  });

  it('discards a stored plan that no longer matches the schema', async () => {
    window.localStorage.setItem('gatherly:plan:v1', '{"version":1,"intake":{}}');

    const { PlanWorkspace } = await import('@/features/workspace');
    const { renderWithProvider } = await import('../helpers');
    renderWithProvider(<PlanWorkspace />);

    expect(
      await screen.findByRole('heading', { name: 'There is no plan yet.' }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem('gatherly:plan:v1')).toBeNull();
  });
});
