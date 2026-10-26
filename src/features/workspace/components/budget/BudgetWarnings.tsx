'use client';

import { useAccessibility } from '@/features/accessibility/provider';
import type { BudgetWarning } from '@/features/budget/services';

/**
 * The warnings the budget raised.
 *
 * Severity is never colour alone: the more serious ones also carry a stronger
 * border and sit in their own paragraph, and each one names what it measured.
 */
export function BudgetWarnings({ warnings }: { warnings: readonly BudgetWarning[] }) {
  const { dictionary } = useAccessibility();
  const t = dictionary;

  return (
    <section aria-labelledby="warnings-heading">
      <h2 id="warnings-heading" className="font-display text-title">
        {t.workspace.warnings}
      </h2>
      {warnings.length === 0 ? (
        <p className="mt-3 rounded-card border border-line bg-raised p-4 text-sm text-ink-muted">
          {t.workspace.noWarnings}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {warnings.map((warning) => (
            <li
              key={warning.id}
              className={`rounded-card border p-4 ${
                warning.severity === 'attention'
                  ? 'border-marigold bg-marigold/10'
                  : 'border-line bg-raised'
              }`}
            >
              <h3 className="font-semibold text-ink">{warning.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{warning.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
