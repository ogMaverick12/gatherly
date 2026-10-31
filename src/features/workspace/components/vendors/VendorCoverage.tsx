'use client';

/**
 * Vendor coverage per category and overall.
 * The bar is backed by a written percentage and status, so colour is never the only signal.
 */

import { Card } from '@/components/ui/Card';
import { StatRow } from '@/components/ui/StatRow';
import { useAccessibility } from '@/features/accessibility';
import { VENDOR_STATUS_LABELS, type VendorStatus } from '@/lib/plan';
import type { PlanView } from '../../plan-view';

/**
 * How much of each vendor line is booked.
 *
 * The bar and the percentage say the same thing, so the number is never the
 * only signal, and a category with nothing booked says "none" in words.
 * long-function: one bar: label, fill and percentage are the same measurement and must not drift apart.
 */
export function VendorCoverage({ view }: { view: PlanView }) {
  const { dictionary } = useAccessibility();
  const t = dictionary;

  return (
    <section aria-labelledby="coverage-heading">
      <h2 id="coverage-heading" className="font-display text-title">
        {t.workspace.coverage}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        {view.coverage.overallPercent}% of the planned vendor budget is booked.
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {view.coverage.categories.map((category) => (
          <Card as="li" key={category.category} className="px-4 py-3">
            <StatRow>
              <span className="text-sm font-medium text-ink">{category.label}</span>
              <span className="tabular-nums text-sm text-ink-muted">
                {category.coveragePercent}%
              </span>
            </StatRow>
            <div
              className="mt-1.5 h-1.5 w-full overflow-hidden rounded-pill bg-line"
              role="presentation"
            >
              <div
                className="h-full rounded-pill bg-teal"
                style={{ width: `${Math.max(2, category.coveragePercent)}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-ink-muted">
              {category.hasVendor
                ? VENDOR_STATUS_LABELS[category.status as VendorStatus]
                : t.common.none}
            </p>
          </Card>
        ))}
      </ul>
    </section>
  );
}
