'use client';

/**
 * The budget tab: the allocation table, warnings and what-if scenarios.
 * Each section is its own component; this file only sets the reading order.
 */

import { useAccessibility } from '@/features/accessibility';
import type { PlanView } from '../plan-view';
import { BudgetTable } from './budget/BudgetTable';
import { BudgetWarnings } from './budget/BudgetWarnings';
import { ScenarioCards } from './budget/ScenarioCards';

/** The budget tab: where the money goes, what to watch, and what if. */
export function BudgetPanel({ view }: { view: PlanView }) {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const { budget, plan, scenarios } = view;

  return (
    <div className="space-y-6">
      <section aria-labelledby="allocation-heading">
        <h2 id="allocation-heading" className="font-display text-title">
          {t.workspace.allocation}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{t.workspace.allocationHelp}</p>
        <BudgetTable budget={budget} plan={plan} />
      </section>

      <BudgetWarnings warnings={budget.warnings} />
      <ScenarioCards scenarios={scenarios} currency={plan.intake.currency} />
    </div>
  );
}
