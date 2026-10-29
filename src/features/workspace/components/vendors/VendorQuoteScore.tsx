'use client';

/**
 * The quote score disclosure on a vendor card.
 * Opening it shows every component, the points earned and the reason.
 */

import { useAccessibility } from '@/features/accessibility/provider';
import type { QuoteAssessment } from '@/features/vendors/services';

/**
 * The score, and the working behind it.
 *
 * A score the user cannot audit is worth nothing, so every component shows what
 * it earned and why, in the order the assessor computes them.
 */
export function VendorQuoteScore({ assessment }: { assessment: QuoteAssessment }) {
  const { dictionary } = useAccessibility();
  const t = dictionary;

  return (
    <details className="mt-3 rounded-card border border-line bg-paper p-3">
      <summary className="cursor-pointer text-sm font-semibold text-ink">
        {t.workspace.quoteScore}: {assessment.score}/100
      </summary>
      <ul className="mt-2 space-y-1.5">
        {assessment.components.map((component) => (
          <li key={component.id} className="text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-medium text-ink">{component.label}</span>
              <span className="tabular-nums text-ink-muted">
                {component.earned}/{component.max}
              </span>
            </div>
            <p className="text-xs text-ink-muted">{component.detail}</p>
          </li>
        ))}
      </ul>
    </details>
  );
}
