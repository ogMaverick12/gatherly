import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntakeForm } from '@/features/intake';
import { getPlan, setPlan } from '@/lib/plan-store';
import { renderWithProvider } from '@tests/support/helpers';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace: vi.fn(), back: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/intake',
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

async function fillBasics(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByLabelText('How many guests?'));
  await user.clear(screen.getByLabelText('How many guests?'));
  await user.type(screen.getByLabelText('How many guests?'), '80');
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}

describe('the intake form', () => {
  it('starts on the basics step', () => {
    setPlan(null);
    renderWithProvider(<IntakeForm />);
    expect(screen.getByLabelText('The basics')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'What kind of event is it?' })).toBeInTheDocument();
  });

  it('moves to the next step', async () => {
    const user = userEvent.setup();
    setPlan(null);
    renderWithProvider(<IntakeForm />);
    await fillBasics(user);
    expect(await screen.findByLabelText('The money')).toBeInTheDocument();
  });

  it('shows the per-guest figure on the money step', async () => {
    const user = userEvent.setup();
    setPlan(null);
    renderWithProvider(<IntakeForm />);
    await fillBasics(user);
    expect(await screen.findByText(/per guest, before the 8% contingency/)).toBeInTheDocument();
  });

  it('goes back a step', async () => {
    const user = userEvent.setup();
    setPlan(null);
    renderWithProvider(<IntakeForm />);
    await fillBasics(user);
    await screen.findByLabelText('The money');
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(await screen.findByLabelText('The basics')).toBeInTheDocument();
  });

  it('does not move on when a step is invalid', async () => {
    const user = userEvent.setup();
    setPlan(null);
    renderWithProvider(<IntakeForm />);

    await user.click(screen.getByLabelText('How many guests?'));
    await user.clear(screen.getByLabelText('How many guests?'));
    await user.type(screen.getByLabelText('How many guests?'), '0');
    await user.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('At least one guest.')).toBeInTheDocument();
    expect(screen.getByLabelText('The basics')).toBeInTheDocument();
  });

  it('creates a plan and goes to the workspace', async () => {
    const user = userEvent.setup();
    setPlan(null);
    renderWithProvider(<IntakeForm />);

    await fillBasics(user);
    await screen.findByLabelText('The money');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('group', { name: 'What matters most?' });
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByLabelText('Packs and preferences');
    await user.click(screen.getByRole('button', { name: 'Create the plan' }));

    await waitFor(() => {
      expect(getPlan()).not.toBeNull();
    });
    expect(getPlan()?.intake.guests).toBe(80);
    expect(push).toHaveBeenCalledWith('/plan');
  });

  it('stores the event date when the user chooses one', async () => {
    const user = userEvent.setup();
    setPlan(null);
    renderWithProvider(<IntakeForm />);

    await user.click(screen.getByRole('checkbox', { name: 'Not decided yet' }));
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2027-05-01' } });
    await fillBasics(user);

    await screen.findByLabelText('The money');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('group', { name: 'What matters most?' });
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByLabelText('Packs and preferences');
    await user.click(screen.getByRole('button', { name: 'Create the plan' }));

    await waitFor(() => {
      expect(getPlan()?.intake.eventDate).toBe('2027-05-01');
    });
  });

  it('shows the review of the answers', async () => {
    const user = userEvent.setup();
    setPlan(null);
    renderWithProvider(<IntakeForm />);

    await fillBasics(user);
    await screen.findByLabelText('The money');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('group', { name: 'What matters most?' });
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByLabelText('Packs and preferences');

    expect(screen.getByRole('heading', { name: 'Review' })).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('offers the optional packs without choosing one', async () => {
    const user = userEvent.setup();
    setPlan(null);
    renderWithProvider(<IntakeForm />);

    await fillBasics(user);
    await screen.findByLabelText('The money');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByRole('group', { name: 'What matters most?' });
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await screen.findByLabelText('Packs and preferences');

    const packs = screen.getByRole('group', { name: 'Optional packs' });
    const checkboxes = within(packs).getAllByRole('checkbox');
    expect(checkboxes.every((box) => !(box as HTMLInputElement).checked)).toBe(true);
  });
});
