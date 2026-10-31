import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatRow } from '@/components/ui/StatRow';

describe('the stat row primitive', () => {
  it('renders a baseline-aligned label and value row with forwarded props', () => {
    render(
      <StatRow data-testid="guests-row" className="text-sm">
        <dt>Guests</dt>
        <dd>180</dd>
      </StatRow>,
    );

    const row = screen.getByTestId('guests-row');
    expect(row).toHaveClass('flex', 'items-baseline', 'justify-between', 'gap-3', 'text-sm');
    expect(screen.getByText('180')).toBeInTheDocument();
  });
});
