import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { BudgetPanel } from '@/features/workspace';
import { makeView, renderWithProvider } from '@tests/support/helpers';

describe('the budget table', () => {
  it('labels a positive pack shift', () => {
    renderWithProvider(<BudgetPanel view={makeView({ packs: ['community-feast'] })} />);

    expect(screen.getByText('+3 pack')).toBeInTheDocument();
  });

  it('labels negative and positive pack shifts separately', () => {
    renderWithProvider(<BudgetPanel view={makeView({ packs: ['potluck'] })} />);

    expect(screen.getByText('-2 pack')).toBeInTheDocument();
    expect(screen.getByText('-1 pack')).toBeInTheDocument();
    expect(screen.getByText('+1 pack')).toBeInTheDocument();
  });

  it('emphasises a category whose share is five points from the benchmark', () => {
    renderWithProvider(<BudgetPanel view={makeView({ eventType: 'community', guests: 30 })} />);
    const foodRow = screen.getByRole('row', { name: /Food & drink/ });
    const variance = within(foodRow).getByText(/^\+[5-9](?:\.\d+)?$/);

    expect(variance).toHaveClass('font-semibold');
  });

  it('shows no per-guest total when the plan has no guests', () => {
    renderWithProvider(<BudgetPanel view={makeView({ guests: 0 })} />);
    const table = screen.getByRole('table');
    const totalRow = within(table).getByRole('row', { name: /^Budget/ });

    expect(within(totalRow).getByText('-')).toBeInTheDocument();
  });
});
