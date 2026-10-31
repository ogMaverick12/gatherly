'use client';

/**
 * The what-if scenario cards.
 * Every card shows its total and the difference from the current plan.
 */

import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useAccessibility } from '@/features/accessibility';
import type { BudgetScenario } from '@/features/budget';
import { formatMoney } from '@/lib/money';
import type { Currency } from '@/lib/plan';

/**
 * The what-if scenarios: the same plan with one thing changed.
 *
 * Each card shows the total it would cost and the difference from the current
 * plan, so the trade-off is visible rather than implied.
 */
export function ScenarioCards({
  scenarios,
  currency,
}: {
  scenarios: readonly BudgetScenario[];
  currency: Currency;
}) {
  const { dictionary } = useAccessibility();
  const t = dictionary;

  return (
    <section aria-labelledby="scenarios-heading">
      <h2 id="scenarios-heading" className="font-display text-title">
        {t.workspace.scenarios}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">{t.workspace.scenariosHelp}</p>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        {scenarios.map((scenario) => (
          <Card as="li" key={scenario.id} padding="md">
            <h3 className="font-semibold text-ink">{scenario.label}</h3>
            <p className="mt-1 text-sm text-ink-muted">{scenario.description}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt>
                  <SectionLabel>{t.workspace.amount}</SectionLabel>
                </dt>
                <dd className="tabular-nums font-medium">
                  {formatMoney(scenario.committedMinor, currency)}
                </dd>
              </div>
              <div>
                <dt>
                  <SectionLabel>{t.workspace.difference}</SectionLabel>
                </dt>
                <dd
                  className={`tabular-nums font-medium ${
                    scenario.deltaVsBaseMinor > 0 ? 'text-rose' : 'text-teal'
                  }`}
                >
                  {scenario.deltaVsBaseMinor > 0 ? '+' : ''}
                  {formatMoney(scenario.deltaVsBaseMinor, currency)}
                </dd>
              </div>
            </dl>
            {scenario.exceedsCeiling ? (
              <Chip tone="danger" className="mt-3">
                {t.workspace.exceeds}
              </Chip>
            ) : null}
            {scenario.notes.length > 0 ? (
              <ul className="mt-3 space-y-1 text-xs text-ink-muted">
                {scenario.notes.map((note) => (
                  <li key={note}>- {note}</li>
                ))}
              </ul>
            ) : null}
          </Card>
        ))}
      </ul>
    </section>
  );
}
