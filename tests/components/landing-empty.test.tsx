import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import type * as PlanModule from '@/lib/plan';

vi.mock('@/lib/plan', async (importOriginal) => {
  const actual = await importOriginal<typeof PlanModule>();
  return { ...actual, SAMPLE_PLAN_TEMPLATES: [] };
});

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const { LandingContent } = await import('@/features/workspace');
const { renderWithProvider } = await import('../helpers');

describe('the landing page without a sample template', () => {
  it('still renders the hero without a preview card', () => {
    renderWithProvider(<LandingContent />);
    expect(
      screen.getByRole('heading', {
        name: 'Make room for the moments people will remember.',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText('A sample plan')).not.toBeInTheDocument();
  });
});
