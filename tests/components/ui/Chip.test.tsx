import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Chip } from '@/components/ui/Chip';

describe('the chip primitive', () => {
  it('renders a status pill with the chosen tone and size', () => {
    render(
      <Chip tone="accent" size="sm" title="Basic mode">
        Basic mode
      </Chip>,
    );

    const chip = screen.getByText('Basic mode');
    expect(chip.tagName).toBe('SPAN');
    expect(chip).toHaveClass('bg-marigold', 'text-on-marigold', 'text-[0.65rem]');
    expect(chip).toHaveAttribute('title', 'Basic mode');
  });
});
