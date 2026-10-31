import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '@/components/ui/Card';

describe('the card primitive', () => {
  it('renders the requested element, tone, padding and native props', () => {
    render(
      <Card as="li" tone="paper" padding="lg" className="flex" aria-label="Vendor card">
        Vendor details
      </Card>,
    );

    const card = screen.getByText('Vendor details');
    expect(card.tagName).toBe('LI');
    expect(card).toHaveClass('rounded-card', 'border-line', 'bg-paper', 'p-5', 'flex');
    expect(card).toHaveAttribute('aria-label', 'Vendor card');
  });
});
