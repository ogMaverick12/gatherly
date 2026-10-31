'use client';

/**
 * The budget warnings section.
 * Severity is written in words and borders as well as colour, and each warning explains itself.
 */

import { Card } from '@/components/ui/Card';
import { useAccessibility } from '@/features/accessibility';
import type { BudgetWarning } from '@/features/budget';

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
        <Card as="p" padding="md" className="mt-3 text-sm text-ink-muted">
          {t.workspace.noWarnings}
        </Card>
      ) : (
        <ul className="mt-3 space-y-2">
          {warnings.map((warning) => (
            <Card
              as="li"
              key={warning.id}
              padding="md"
              tone={warning.severity === 'attention' ? 'attention' : 'raised'}
            >
              <h3 className="font-semibold text-ink">{warning.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{warning.detail}</p>
            </Card>
          ))}
        </ul>
      )}
    </section>
  );
}
