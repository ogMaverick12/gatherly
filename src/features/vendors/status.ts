/**
 * Vendor status rules.
 *
 * The status order and the next step from any state, plus the coverage share
 * for one category, kept here so the panel and exports agree.
 */

import type { VendorCategoryId, VendorStatus } from '@/lib/plan';
import { sharePercent } from '@/lib/money';
import type { VendorCoverage } from './coverage';

/** The order vendors move through, and how far each category has got. */
export const STATUS_ORDER: readonly VendorStatus[] = [
  'to_contact',
  'contacted',
  'quoted',
  'booked',
];

/**
 * Returns the next step in the vendor workflow.
 * @param status the current status; a declined vendor starts again
 * @returns the next status, capped at booked
 */
export function nextStatus(status: VendorStatus): VendorStatus {
  if (status === 'declined') return 'to_contact';
  const index = STATUS_ORDER.indexOf(status);
  if (index < 0) return 'to_contact';
  return STATUS_ORDER[Math.min(index + 1, STATUS_ORDER.length - 1)] ?? 'to_contact';
}

/**
 * The share of one category's allocation that is booked.
 * @param coverage the computed vendor coverage
 * @param category the vendor category to look up
 * @returns percent 0-100, or 0 when the category is absent
 * @example
 * vendorCoverageShare(coverage, 'venue'); // e.g. 72
 */
export function vendorCoverageShare(coverage: VendorCoverage, category: VendorCategoryId): number {
  const found = coverage.categories.find((item) => item.category === category);
  return found ? sharePercent(found.bookedMinor, found.allocatedMinor) : 0;
}
