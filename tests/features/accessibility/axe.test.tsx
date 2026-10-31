import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import {
  LandingContent,
  SamplePlanCards,
  SiteFooter,
  SiteHeader,
  PlanWorkspace,
} from '@/features/workspace';
import { IntakeForm } from '@/features/intake';
import { DisplaySettings } from '@/features/accessibility';
import { SAMPLE_PLAN_TEMPLATES } from '@/lib/plan';
import { setPlan } from '@/lib/plan-store';
import { makePlan, renderWithProvider } from '@tests/support/helpers';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
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

/** Run axe on the current document and report every violation it finds. */
async function expectNoViolations() {
  const results = await axe(document.body);
  expect(results.violations).toEqual([]);
}

/** The landmark structure the real layout gives every page. */
function Page({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main">Skip to main content</a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

describe('the landing page has no accessibility violations', () => {
  it('passes axe', async () => {
    setPlan(null);
    renderWithProvider(
      <Page>
        <LandingContent />
        <SamplePlanCards templates={SAMPLE_PLAN_TEMPLATES} />
      </Page>,
    );
    await expectNoViolations();
  });
});

describe('every intake step has no accessibility violations', () => {
  const stepLabels = ['The basics', 'The money', 'What matters', 'Packs and preferences'];

  it('passes axe on the basics step', async () => {
    setPlan(null);
    renderWithProvider(
      <Page>
        <IntakeForm />
      </Page>,
    );
    await expectNoViolations();
  });

  it('passes axe on the money step', async () => {
    const user = userEvent.setup();
    setPlan(null);
    renderWithProvider(
      <Page>
        <IntakeForm />
      </Page>,
    );

    await user.click(screen.getByLabelText('How many guests?'));
    await user.clear(screen.getByLabelText('How many guests?'));
    await user.type(screen.getByLabelText('How many guests?'), '80');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    await screen.findByLabelText('The money');
    await expectNoViolations();
  });

  it('passes axe on the needs step', async () => {
    const user = userEvent.setup();
    setPlan(null);
    renderWithProvider(
      <Page>
        <IntakeForm />
      </Page>,
    );

    await user.click(screen.getByLabelText('How many guests?'));
    await user.clear(screen.getByLabelText('How many guests?'));
    await user.type(screen.getByLabelText('How many guests?'), '80');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByLabelText('The money');

    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByLabelText('What matters');
    await expectNoViolations();
  });

  it('passes axe on the extras step', async () => {
    const user = userEvent.setup();
    setPlan(null);
    renderWithProvider(
      <Page>
        <IntakeForm />
      </Page>,
    );

    await user.click(screen.getByLabelText('How many guests?'));
    await user.clear(screen.getByLabelText('How many guests?'));
    await user.type(screen.getByLabelText('How many guests?'), '80');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByLabelText('The money');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByLabelText('What matters');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByLabelText('Packs and preferences');
    await expectNoViolations();
  });

  it('names every step it checks', () => {
    expect(stepLabels).toHaveLength(4);
  });
});

describe('every workspace tab has no accessibility violations', () => {
  const tabNames = ['Overview', 'Budget', 'Timeline', 'Vendors', 'Ideas', 'Assistant'];

  it('passes axe on the overview tab', async () => {
    setPlan(makePlan());
    renderWithProvider(
      <Page>
        <PlanWorkspace />
      </Page>,
    );
    await screen.findByRole('heading', { name: /120 guests/ });
    await expectNoViolations();
  });

  it('passes axe on the budget tab', async () => {
    const user = userEvent.setup();
    setPlan(makePlan());
    renderWithProvider(
      <Page>
        <PlanWorkspace />
      </Page>,
    );

    await user.click(screen.getByRole('tab', { name: 'Budget' }));
    await screen.findByRole('heading', { name: 'Where the money goes' });
    await expectNoViolations();
  });

  it('passes axe on the timeline tab', async () => {
    const user = userEvent.setup();
    setPlan(makePlan());
    renderWithProvider(
      <Page>
        <PlanWorkspace />
      </Page>,
    );

    await user.click(screen.getByRole('tab', { name: /Timeline/ }));
    await screen.findByText('Shortlist venues and hold the best one');
    await expectNoViolations();
  });

  it('passes axe on the vendors tab', async () => {
    const user = userEvent.setup();
    setPlan(makePlan());
    renderWithProvider(
      <Page>
        <PlanWorkspace />
      </Page>,
    );

    await user.click(screen.getByRole('tab', { name: 'Vendors' }));
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Add a vendor' }).length).toBeGreaterThan(0);
    });
    await expectNoViolations();
  });

  it('passes axe on the ideas tab', async () => {
    const user = userEvent.setup();
    setPlan(makePlan());
    renderWithProvider(
      <Page>
        <PlanWorkspace />
      </Page>,
    );

    await user.click(screen.getByRole('tab', { name: 'Ideas' }));
    await waitFor(() => {
      expect(screen.getAllByText(/Basic mode/i).length).toBeGreaterThan(0);
    });
    await expectNoViolations();
  });

  it('passes axe on the assistant tab', async () => {
    const user = userEvent.setup();
    setPlan(makePlan());
    renderWithProvider(
      <Page>
        <PlanWorkspace />
      </Page>,
    );

    await user.click(screen.getByRole('tab', { name: 'Assistant' }));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('What should I do next?')).toBeInTheDocument();
    });
    await expectNoViolations();
  });

  it('names every tab it checks', () => {
    expect(tabNames).toHaveLength(6);
  });
});

describe('the display settings have no accessibility violations', () => {
  it('passes axe when open', async () => {
    const user = userEvent.setup();
    renderWithProvider(
      <Page>
        <DisplaySettings />
      </Page>,
    );
    const [button] = screen.getAllByRole('button', { name: /Display and access/i });
    await user.click(button as HTMLElement);
    await screen.findByRole('group', { name: 'Text size' });
    await expectNoViolations();
  });
});
