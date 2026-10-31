import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LandingContent, SamplePlanCards, SiteFooter } from '@/features/workspace';
import { SAMPLE_PLAN_TEMPLATES } from '@/lib/plan';
import { getPlan, setPlan } from '@/lib/plan-store';
import { renderWithProvider } from '../helpers';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe('the landing page', () => {
  it('says what the app is for', () => {
    renderWithProvider(<LandingContent />);
    expect(
      screen.getByRole('heading', {
        name: 'Make room for the moments people will remember.',
      }),
    ).toBeInTheDocument();
  });

  it('shows a computed sample preview', () => {
    renderWithProvider(<LandingContent />);
    expect(screen.getByText('A sample plan')).toBeInTheDocument();
    expect(screen.getByText(/180 guests,/)).toBeInTheDocument();
  });

  it('lists the features', () => {
    renderWithProvider(<LandingContent />);
    expect(screen.getByText('Visible budget maths')).toBeInTheDocument();
    expect(screen.getByText('Honest plan health')).toBeInTheDocument();
  });

  it('says the plan stays on the device', () => {
    renderWithProvider(<SiteFooter />);
    expect(
      screen.getByText(/Your plan stays on this device. No account, no upload, no tracking./),
    ).toBeInTheDocument();
  });
});

describe('the sample plan cards', () => {
  it('offers one card per sample', () => {
    renderWithProvider(<SamplePlanCards templates={SAMPLE_PLAN_TEMPLATES} />);
    expect(screen.getByText('A 180-guest wedding')).toBeInTheDocument();
    expect(screen.getByText('A 60-guest garden birthday')).toBeInTheDocument();
    expect(screen.getByText('A 240-guest community feast')).toBeInTheDocument();
  });

  it('opens a real, editable plan', async () => {
    const user = userEvent.setup();
    setPlan(null);
    renderWithProvider(<SamplePlanCards templates={SAMPLE_PLAN_TEMPLATES} />);

    const buttons = screen.getAllByRole('button', { name: /Open a sample plan/i });
    await user.click(buttons[0] as HTMLElement);

    await waitFor(() => {
      expect(getPlan()).not.toBeNull();
    });
    expect(getPlan()?.tasks.length).toBeGreaterThan(0);
    expect(getPlan()?.intake.eventDate).not.toBeNull();
    expect(push).toHaveBeenCalledWith('/plan');
  });
});
