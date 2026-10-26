'use client';

import { useAccessibility } from '@/features/accessibility/provider';
import { formatMinor } from '@/lib/money';
import type { Plan } from '@/lib/plan';
import type { BudgetAllocation } from '@/features/budget/services';

/**
 * Where the money goes, one row per category.
 *
 * The table shows the working - the base share, the share after priorities and
 * the amount - because a number the user cannot check is a number they cannot
 * argue with.
 */
export function BudgetTable({ budget, plan }: { budget: BudgetAllocation; plan: Plan }) {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const currency = plan.intake.currency;

  return (
    <div className="mt-3 overflow-x-auto rounded-card border border-line bg-raised">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <caption className="sr-only">
          {t.workspace.allocation}. {t.workspace.allocationHelp}
        </caption>
        <thead>
          <tr className="border-b border-line text-left">
            <th scope="col" className="px-4 py-3 font-semibold">
              {t.workspace.allocation}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              {t.workspace.baseShare}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              {t.workspace.afterPriorities}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              {t.workspace.share}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              {t.workspace.amount}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              {t.workspace.perGuestColumn}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              {t.workspace.typical}
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              {t.workspace.difference}
            </th>
          </tr>
        </thead>
        <tbody>
          {budget.categories.map((category) => (
            <tr key={category.id} className="border-b border-line/70 last:border-0">
              <th scope="row" className="px-4 py-3 text-left font-medium">
                {category.label}
                {category.priorityBoost ? (
                  <span className="ml-2 rounded-pill bg-teal/15 px-2 py-0.5 text-[0.65rem] font-semibold text-teal">
                    priority
                  </span>
                ) : null}
                {category.packShift !== 0 ? (
                  <span className="ml-2 rounded-pill bg-marigold/25 px-2 py-0.5 text-[0.65rem] font-semibold text-ink">
                    {category.packShift > 0 ? '+' : ''}
                    {category.packShift} pack
                  </span>
                ) : null}
              </th>
              <td className="px-4 py-3 text-right tabular-nums text-ink-muted">
                {category.baseWeight}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{category.effectiveWeight}</td>
              <td className="px-4 py-3 text-right tabular-nums">{category.sharePercent}%</td>
              <td className="px-4 py-3 text-right tabular-nums font-medium">
                {formatMinor(category.amountMinor, currency)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-ink-muted">
                {category.perGuestMinor === null
                  ? '-'
                  : formatMinor(category.perGuestMinor, currency)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-ink-muted">
                {category.benchmarkSharePercent}%
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                <span
                  className={
                    Math.abs(category.varianceFromBenchmark) >= 5
                      ? 'font-semibold text-marigold-dark'
                      : 'text-ink-muted'
                  }
                >
                  {category.varianceFromBenchmark > 0 ? '+' : ''}
                  {category.varianceFromBenchmark}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-line-strong">
            <th scope="row" className="px-4 py-3 text-left font-semibold">
              {t.workspace.contingency}
            </th>
            <td className="px-4 py-3" />
            <td className="px-4 py-3" />
            <td className="px-4 py-3 text-right tabular-nums">{budget.math.contingencyPercent}%</td>
            <td className="px-4 py-3 text-right tabular-nums font-semibold">
              {formatMinor(budget.contingencyMinor, currency)}
            </td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3" />
            <td className="px-4 py-3" />
          </tr>
          <tr>
            <th scope="row" className="px-4 py-3 text-left font-semibold">
              {t.workspace.budget}
            </th>
            <td className="px-4 py-3" />
            <td className="px-4 py-3" />
            <td className="px-4 py-3 text-right tabular-nums">100%</td>
            <td className="px-4 py-3 text-right tabular-nums font-semibold">
              {formatMinor(budget.totalMinor, currency)}
            </td>
            <td className="px-4 py-3 text-right tabular-nums text-ink-muted">
              {plan.intake.guests > 0
                ? formatMinor(Math.round(budget.totalMinor / plan.intake.guests), currency)
                : '-'}
            </td>
            <td className="px-4 py-3" />
            <td className="px-4 py-3" />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
