import { describe, expect, it, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import { computePlanView, VendorsPanel, type PlanView } from '@/features/workspace';
import { formatMoney } from '@/lib/money';
import { makePlan, makeVendor as vendor } from '@tests/support/factories';
import { renderWithProvider } from '@tests/support/helpers';

function viewWithVendor(vendorPatch: Parameters<typeof vendor>[0] = {}): PlanView {
  const plan = { ...makePlan(), vendors: [vendor(vendorPatch)] };
  return computePlanView(plan, '2026-11-25');
}

function renderPanel(view: PlanView) {
  return renderWithProvider(
    <VendorsPanel view={view} onUpdateVendor={vi.fn()} onAddVendor={vi.fn()} />,
  );
}

describe('the vendor card', () => {
  it('compares a recorded quote with the budget line and explains the missing phone link', () => {
    const view = viewWithVendor({ quotedMinor: 1_000_000 });
    const allocation = view.allocationByCategory.catering ?? 0;
    renderPanel(view);

    expect(
      screen.getByText(
        `${formatMoney(1_000_000, 'INR')} / ${formatMoney(allocation, 'INR')} planned`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Add a phone number to open a chat.')).toBeInTheDocument();
  });

  it('omits the comparison when no quote has been recorded', () => {
    renderPanel(viewWithVendor({ phone: '+919876543210', quotedMinor: null }));
    const checklist = within(screen.getByRole('region', { name: 'Vendor checklist' }));
    const contact = checklist.getByRole('link', { name: 'Message' });

    expect(contact.getAttribute('href')).toContain('wa.me/919876543210');
    expect(checklist.queryByText(/planned$/)).not.toBeInTheDocument();
  });

  it('treats a category missing from the allocation as zero budget', () => {
    const view = viewWithVendor({ quotedMinor: 1_000_000 });
    const allocationByCategory = Object.fromEntries(
      Object.entries(view.allocationByCategory).filter(([category]) => category !== 'catering'),
    ) as typeof view.allocationByCategory;
    renderPanel({ ...view, allocationByCategory });

    expect(screen.getByText(`${formatMoney(1_000_000, 'INR')} / ₹0 planned`)).toBeInTheDocument();
    expect(
      screen.getByText('No budget line for this category yet, so fit cannot be judged.'),
    ).toBeInTheDocument();
  });
});
