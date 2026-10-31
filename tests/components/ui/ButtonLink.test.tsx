import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ButtonLink } from '@/components/ui/ButtonLink';

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('the button link primitive', () => {
  it('renders a styled anchor and forwards its native props', () => {
    const onClick = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
    });
    render(
      <ButtonLink
        href="/plan"
        variant="secondary"
        size="compact"
        className="mt-2"
        onClick={onClick}
      >
        Open plan
      </ButtonLink>,
    );

    const link = screen.getByRole('link', { name: 'Open plan' });
    expect(link).toHaveAttribute('href', '/plan');
    expect(link).toHaveClass('min-h-11', 'border-line-strong', 'px-4', 'mt-2');
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
