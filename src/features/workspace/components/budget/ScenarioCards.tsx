'use client';

/**
 * The what-if scenario cards.
 * Every card shows its total and the difference from the current plan.
 */

import { useAccessibility } from '@/features/accessibility/provider';
import type { BudgetScenario } from '@/features/budget/services';
import { formatMoney } from '@/lib/money';
import type { Currency } from '@/lib/plan';

/**
 * The what-if scenarios: the same plan with one thing changed.
 *
 * Each card shows the total it would cost and the difference from the current
 * plan, so the trade-off is visible rather than implied.
 * long-function: one card list over one scenario array, with every card using the same money formatting.
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
          <li key={scenario.id} className="rounded-card border border-line bg-raised p-4">
            <h3 className="font-semibold text-ink">{scenario.label}</h3>
            <p className="mt-1 text-sm text-ink-muted">{scenario.description}</p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.12em] text-ink-muted">
                  {t.workspace.amount}
                </dt>
                <dd className="tabular-nums font-medium">
                  {formatMoney(scenario.committedMinor, currency)}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.12em] text-ink-muted">
                  {t.workspace.difference}
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
              <p className="mt-3 rounded-pill bg-rose/10 px-3 py-1 text-xs font-semibold text-rose">
                {t.workspace.exceeds}
              </p>
            ) : null}
            {scenario.notes.length > 0 ? (
              <ul className="mt-3 space-y-1 text-xs text-ink-muted">
                {scenario.notes.map((note) => (
                  <li key={note}>- {note}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
