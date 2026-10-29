/**
 * Vendor coverage.
 *
 * Compares what each checklist category was allocated with what has actually
 * been quoted and booked, in integer minor units throughout.
 */

import type { BudgetCategoryId, Plan, Vendor, VendorCategoryId, VendorStatus } from '@/lib/plan';
import { VENDOR_CATEGORY_LABELS } from '@/lib/plan';
import { VENDOR_CATEGORY_BUDGET_LINE, vendorChecklist } from './checklist';

export interface CategoryCoverage {
  readonly category: VendorCategoryId;
  readonly label: string;
  readonly allocatedMinor: number;
  readonly quotedMinor: number;
  readonly bookedMinor: number;
  readonly coveragePercent: number;
  readonly status: VendorStatus | 'not-started';
  readonly hasVendor: boolean;
}

export interface VendorCoverage {
  readonly categories: readonly CategoryCoverage[];
  readonly overallPercent: number;
  readonly allocatedMinor: number;
  readonly bookedMinor: number;
  readonly quotedMinor: number;
  readonly outstandingCount: number;
  readonly nextAction: string | null;
}

/** The furthest a category has got: booked beats quoted beats contacted. */
function statusOf(vendors: readonly Vendor[]): CategoryCoverage['status'] {
  if (vendors.some((vendor) => vendor.status === 'booked')) return 'booked';
  if (vendors.some((vendor) => vendor.status === 'quoted')) return 'quoted';
  if (vendors.some((vendor) => vendor.status === 'contacted')) return 'contacted';
  if (vendors.some((vendor) => vendor.status === 'to_contact')) return 'to_contact';
  return 'not-started';
}

/** One vendor category: what it was given, what it has quoted and booked. */
function categoryCoverage(
  category: VendorCategoryId,
  plan: Plan,
  allocationByCategory: Readonly<Record<BudgetCategoryId, number>>,
): CategoryCoverage {
  const budgetLine = VENDOR_CATEGORY_BUDGET_LINE[category];
  const allocatedMinor = allocationByCategory[budgetLine] ?? 0;
  const vendors = plan.vendors.filter((vendor) => vendor.category === category);
  const quotedMinor = vendors.reduce((sum, vendor) => sum + (vendor.quotedMinor ?? 0), 0);
  const bookedMinor = vendors
    .filter((vendor) => vendor.status === 'booked')
    .reduce((sum, vendor) => sum + (vendor.quotedMinor ?? vendor.depositMinor ?? 0), 0);
  const coveragePercent =
    allocatedMinor > 0
      ? Math.min(100, Math.round((bookedMinor / allocatedMinor) * 100))
      : bookedMinor > 0
        ? 100
        : 0;
  return {
    category,
    label: VENDOR_CATEGORY_LABELS[category],
    allocatedMinor,
    quotedMinor,
    bookedMinor,
    coveragePercent,
    status: statusOf(vendors),
    hasVendor: vendors.length > 0,
  };
}

/**
 * Builds coverage rows for every checklist category and the overall percentage.
 * @param plan the stored plan whose event type, vendors and quotes are read
 * @param allocationByCategory the budgeted amount per category, integer minor units (paise)
 * @returns booked and quoted totals in paise, with each category's coverage percent 0-100
 * @example
 * computeVendorCoverage(plan, allocation).overallPercent; // percent 0-100
 */
export function computeVendorCoverage(
  plan: Plan,
  allocationByCategory: Readonly<Record<BudgetCategoryId, number>>,
): VendorCoverage {
  const categories = vendorChecklist(plan.intake.eventType).map((category) =>
    categoryCoverage(category, plan, allocationByCategory),
  );

  const allocatedMinor = categories.reduce((sum, item) => sum + item.allocatedMinor, 0);
  const bookedMinor = categories.reduce((sum, item) => sum + item.bookedMinor, 0);
  const quotedMinor = categories.reduce((sum, item) => sum + item.quotedMinor, 0);
  const coveredMinor = categories.reduce(
    (sum, item) => sum + Math.min(item.bookedMinor, item.allocatedMinor),
    0,
  );
  const overallPercent = allocatedMinor > 0 ? Math.round((coveredMinor / allocatedMinor) * 100) : 0;

  const outstanding = plan.vendors.filter(
    (vendor) => vendor.status !== 'booked' && vendor.status !== 'declined',
  );

  return {
    categories,
    overallPercent,
    allocatedMinor,
    bookedMinor,
    quotedMinor,
    outstandingCount: outstanding.length,
    nextAction: outstanding[0]?.name
      ? `Follow up with ${outstanding[0].name || VENDOR_CATEGORY_LABELS[outstanding[0].category]}`
      : outstanding.length > 0
        ? `Contact the next vendor: ${VENDOR_CATEGORY_LABELS[outstanding[0]?.category ?? 'venue']}`
        : null,
  };
}
