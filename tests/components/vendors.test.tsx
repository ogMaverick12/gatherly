import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VendorsPanel } from '@/features/workspace/components/VendorsPanel';
import { ServiceWorkerRegistrar } from '@/features/accessibility/components/ServiceWorkerRegistrar';
import { OfflineBanner } from '@/features/accessibility/components/OfflineBanner';
import { setPlan } from '@/lib/plan-store';
import { computePlanView } from '@/lib/plan-view';
import type { Plan, Vendor } from '@/lib/plan';
import { makePlan, makeView, renderWithProvider } from '../helpers';

vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const VENDOR: Vendor = {
  id: 'vendor_1',
  category: 'caterer',
  name: 'Saffron Kitchen',
  status: 'contacted',
  quotedMinor: null,
  depositMinor: null,
  dueDate: null,
  phone: '',
  notes: '',
};

function viewWithVendors(vendors: Vendor[]) {
  const plan: Plan = { ...makePlan(), vendors };
  return computePlanView(plan);
}

describe('the vendors panel', () => {
  beforeEach(() => {
    setPlan(null);
  });

  it('shows the coverage of each category', () => {
    renderWithProvider(
      <VendorsPanel view={makeView()} onUpdateVendor={vi.fn()} onAddVendor={vi.fn()} />,
    );

    expect(screen.getByRole('heading', { name: 'Coverage' })).toBeInTheDocument();
    expect(screen.getByText(/of the planned vendor budget is booked/)).toBeInTheDocument();
  });

  it('offers to add a vendor for every empty category', async () => {
    const user = userEvent.setup();
    const onAddVendor = vi.fn();
    renderWithProvider(
      <VendorsPanel view={makeView()} onUpdateVendor={vi.fn()} onAddVendor={onAddVendor} />,
    );

    await user.click(screen.getAllByRole('button', { name: 'Add a vendor' })[0] as HTMLElement);
    expect(onAddVendor).toHaveBeenCalledOnce();
  });

  it('adds a vendor with a name', async () => {
    const user = userEvent.setup();
    const onAddVendor = vi.fn();
    renderWithProvider(
      <VendorsPanel view={makeView()} onUpdateVendor={vi.fn()} onAddVendor={onAddVendor} />,
    );

    await user.selectOptions(screen.getByLabelText('Category'), 'caterer');
    await user.type(screen.getByLabelText('Name'), 'Saffron Kitchen');
    const addButtons = screen.getAllByRole('button', { name: 'Add a vendor' });
    await user.click(addButtons[addButtons.length - 1] as HTMLElement);

    expect(onAddVendor).toHaveBeenCalledWith('caterer', 'Saffron Kitchen');
  });

  it('changes the status of a vendor', async () => {
    const user = userEvent.setup();
    const onUpdateVendor = vi.fn();
    const view = viewWithVendors([VENDOR]);

    renderWithProvider(
      <VendorsPanel view={view} onUpdateVendor={onUpdateVendor} onAddVendor={vi.fn()} />,
    );

    await user.selectOptions(screen.getByLabelText('Status'), 'booked');
    expect(onUpdateVendor).toHaveBeenCalledWith(VENDOR.id, { status: 'booked' });
  });

  it('saves a quote', async () => {
    const user = userEvent.setup();
    const onUpdateVendor = vi.fn();
    const view = viewWithVendors([VENDOR]);

    renderWithProvider(
      <VendorsPanel view={view} onUpdateVendor={onUpdateVendor} onAddVendor={vi.fn()} />,
    );

    const quote = screen.getByLabelText(/Quote \(INR\)/);
    await user.clear(quote);
    await user.type(quote, '45000');
    await user.tab();

    expect(onUpdateVendor).toHaveBeenCalledWith(VENDOR.id, { quotedMinor: 4_500_000 });
  });

  it('saves a due date', async () => {
    const user = userEvent.setup();
    const onUpdateVendor = vi.fn();
    const view = viewWithVendors([VENDOR]);

    renderWithProvider(
      <VendorsPanel view={view} onUpdateVendor={onUpdateVendor} onAddVendor={vi.fn()} />,
    );

    const due = screen.getByLabelText('Payment due');
    await user.clear(due);
    await user.type(due, '2026-11-01');
    expect(onUpdateVendor).toHaveBeenCalledWith(VENDOR.id, { dueDate: '2026-11-01' });
  });

  it('saves a phone number and notes', async () => {
    const user = userEvent.setup();
    const onUpdateVendor = vi.fn();
    const view = viewWithVendors([VENDOR]);

    renderWithProvider(
      <VendorsPanel view={view} onUpdateVendor={onUpdateVendor} onAddVendor={vi.fn()} />,
    );

    const phone = screen.getByLabelText('Phone');
    await user.clear(phone);
    await user.type(phone, '+91 98765 43210');
    await user.tab();
    expect(onUpdateVendor).toHaveBeenCalledWith(VENDOR.id, {
      phone: '+91 98765 43210',
    });

    const notes = screen.getByLabelText('Notes');
    await user.clear(notes);
    await user.type(notes, 'Ask for the vegetarian menu.');
    await user.tab();
    expect(onUpdateVendor).toHaveBeenCalledWith(VENDOR.id, {
      notes: 'Ask for the vegetarian menu.',
    });
  });

  it('refuses a quote that is not a number', async () => {
    const user = userEvent.setup();
    const onUpdateVendor = vi.fn();
    const view = viewWithVendors([VENDOR]);

    renderWithProvider(
      <VendorsPanel view={view} onUpdateVendor={onUpdateVendor} onAddVendor={vi.fn()} />,
    );

    const quote = screen.getByLabelText(/Quote \(INR\)/);
    await user.clear(quote);
    await user.type(quote, '-5');
    await user.tab();

    const calls = onUpdateVendor.mock.calls.filter((call) => 'quotedMinor' in (call[1] as object));
    for (const call of calls) {
      expect((call[1] as { quotedMinor: number }).quotedMinor).toBeGreaterThanOrEqual(0);
    }
  });

  it('offers a WhatsApp link when the phone number is usable', () => {
    const view = viewWithVendors([{ ...VENDOR, phone: '+91 98765 43210' }]);

    renderWithProvider(<VendorsPanel view={view} onUpdateVendor={vi.fn()} onAddVendor={vi.fn()} />);

    const link = screen.getByRole('link', { name: 'Message' });
    expect(link.getAttribute('href')).toContain('https://wa.me/');
  });

  it('says when there is no usable phone number', () => {
    const view = viewWithVendors([VENDOR]);

    renderWithProvider(<VendorsPanel view={view} onUpdateVendor={vi.fn()} onAddVendor={vi.fn()} />);

    expect(screen.getByText('Add a phone number to open a chat.')).toBeInTheDocument();
  });
});

describe('the offline banner', () => {
  it('says when the browser is offline', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    });
    renderWithProvider(<OfflineBanner />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });

  it('says nothing when the browser is online', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: true,
    });
    renderWithProvider(<OfflineBanner />);
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument();
  });
});

describe('the service worker registrar', () => {
  it('registers the worker', async () => {
    const register = vi.fn(async () => ({ unregister: vi.fn(async () => true) }));
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: { register },
    });

    renderWithProvider(<ServiceWorkerRegistrar />);

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    });
  });

  it('survives a browser that has no service worker', () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: undefined,
    });
    // jsdom has no service worker, so the property is removed entirely.
    Reflect.deleteProperty(navigator, 'serviceWorker');

    renderWithProvider(<ServiceWorkerRegistrar />);
    expect(document.querySelector('script')).toBeNull();
  });
});
