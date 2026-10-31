import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('the button primitive', () => {
  it('renders a primary button, forwards props and keeps the 44px touch target', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} aria-label="Continue" className="mt-2">
        Continue
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Continue' });
    expect(button).toHaveClass('min-h-11', 'bg-ink', 'mt-2');
    expect(button).toHaveAttribute('type', 'button');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('keeps the touch target while applying the secondary and quiet variants', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>);

    expect(screen.getByRole('button')).toHaveClass('min-h-11', 'border-line-strong');

    rerender(<Button variant="quiet">Quiet</Button>);
    expect(screen.getByRole('button')).toHaveClass('min-h-11', 'text-ink-muted');
  });
});
