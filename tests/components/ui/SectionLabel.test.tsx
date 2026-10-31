import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionLabel } from '@/components/ui/SectionLabel';

describe('the section label primitive', () => {
  it('renders an uppercase label with the chosen tone and tracking', () => {
    render(
      <SectionLabel tone="teal" spacing="widest" size="sm" className="mt-2">
        Exports
      </SectionLabel>,
    );

    const label = screen.getByText('Exports');
    expect(label.tagName).toBe('SPAN');
    expect(label).toHaveClass('uppercase', 'text-sm', 'text-teal', 'tracking-[0.18em]', 'mt-2');
  });
});
