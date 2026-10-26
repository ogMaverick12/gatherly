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

export function nextStatus(status: VendorStatus): VendorStatus {
  if (status === 'declined') return 'to_contact';
  const index = STATUS_ORDER.indexOf(status);
  if (index < 0) return 'to_contact';
  return STATUS_ORDER[Math.min(index + 1, STATUS_ORDER.length - 1)] ?? 'to_contact';
}

export function vendorCoverageShare(coverage: VendorCoverage, category: VendorCategoryId): number {
  const found = coverage.categories.find((item) => item.category === category);
  return found ? sharePercent(found.bookedMinor, found.allocatedMinor) : 0;
}
