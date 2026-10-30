'use client';

/**
 * The budget allocation table.
 * Each row shows the base share, the adjusted share and the amount so the maths can be checked.
 */

import { useAccessibility } from '@/features/accessibility/provider';
import type { BudgetAllocation, CategoryAllocation } from '@/features/budget/services';
import type { Dictionary } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import type { Plan } from '@/lib/plan';

/** The eight column headings. */
export function BudgetTableHead({ t }: { readonly t: Dictionary }) {
  return (
    <thead>
      <tr className="border-b border-line text-left">
        <th scope="col" className="px-3 py-3 sm:px-4 font-semibold">
          {t.workspace.allocation}
        </th>
        <th scope="col" className="hidden px-3 py-3 text-right font-semibold sm:table-cell sm:px-4">
          {t.workspace.baseShare}
        </th>
        <th scope="col" className="hidden px-3 py-3 text-right font-semibold sm:table-cell sm:px-4">
          {t.workspace.afterPriorities}
        </th>
        <th scope="col" className="px-3 py-3 text-right font-semibold sm:px-4">
          {t.workspace.share}
        </th>
        <th scope="col" className="px-3 py-3 text-right font-semibold sm:px-4">
          {t.workspace.amount}
        </th>
        <th scope="col" className="hidden px-3 py-3 text-right font-semibold sm:table-cell sm:px-4">
          {t.workspace.perGuestColumn}
        </th>
        <th scope="col" className="hidden px-3 py-3 text-right font-semibold sm:table-cell sm:px-4">
          {t.workspace.typical}
        </th>
        <th scope="col" className="hidden px-3 py-3 text-right font-semibold sm:table-cell sm:px-4">
          {t.workspace.difference}
        </th>
      </tr>
    </thead>
  );
}

/** One category row with its weights, shares and variance. */
export function BudgetTableRow({
  category,
  currency,
}: {
  readonly category: CategoryAllocation;
  readonly currency: Plan['intake']['currency'];
}) {
  return (
    <tr className="border-b border-line/70 last:border-0">
      <th scope="row" className="px-3 py-3 sm:px-4 text-left font-medium">
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
      <td className="hidden px-3 py-3 text-right tabular-nums text-ink-muted sm:table-cell sm:px-4">
        {category.baseWeight}
      </td>
      <td className="hidden px-3 py-3 text-right tabular-nums sm:table-cell sm:px-4">
        {category.effectiveWeight}
      </td>
      <td className="px-3 py-3 text-right tabular-nums sm:px-4">{category.sharePercent}%</td>
      <td className="px-3 py-3 text-right tabular-nums font-medium sm:px-4">
        {formatMoney(category.amountMinor, currency)}
      </td>
      <td className="hidden px-3 py-3 text-right tabular-nums text-ink-muted sm:table-cell sm:px-4">
        {category.perGuestMinor === null ? '-' : formatMoney(category.perGuestMinor, currency)}
      </td>
      <td className="hidden px-3 py-3 text-right tabular-nums text-ink-muted sm:table-cell sm:px-4">
        {category.benchmarkSharePercent}%
      </td>
      <td className="hidden px-3 py-3 text-right tabular-nums sm:table-cell sm:px-4">
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
  );
}

/** The contingency and total rows. */
export function BudgetTableFoot({
  budget,
  guests,
  currency,
  t,
}: {
  readonly budget: BudgetAllocation;
  readonly guests: number;
  readonly currency: Plan['intake']['currency'];
  readonly t: Dictionary;
}) {
  return (
    <tfoot>
      <tr className="border-t-2 border-line-strong">
        <th scope="row" className="px-3 py-3 sm:px-4 text-left font-semibold">
          {t.workspace.contingency}
        </th>
        <td className="hidden px-3 py-3 sm:table-cell sm:px-4" />
        <td className="hidden px-3 py-3 sm:table-cell sm:px-4" />
        <td className="px-3 py-3 text-right tabular-nums sm:px-4">
          {budget.math.contingencyPercent}%
        </td>
        <td className="px-3 py-3 text-right tabular-nums font-semibold sm:px-4">
          {formatMoney(budget.contingencyMinor, currency)}
        </td>
        <td className="hidden px-3 py-3 sm:table-cell sm:px-4" />
        <td className="hidden px-3 py-3 sm:table-cell sm:px-4" />
        <td className="hidden px-3 py-3 sm:table-cell sm:px-4" />
      </tr>
      <tr>
        <th scope="row" className="px-3 py-3 sm:px-4 text-left font-semibold">
          {t.workspace.budget}
        </th>
        <td className="hidden px-3 py-3 sm:table-cell sm:px-4" />
        <td className="hidden px-3 py-3 sm:table-cell sm:px-4" />
        <td className="px-3 py-3 text-right tabular-nums sm:px-4">100%</td>
        <td className="px-3 py-3 text-right tabular-nums font-semibold sm:px-4">
          {formatMoney(budget.totalMinor, currency)}
        </td>
        <td className="hidden px-3 py-3 text-right tabular-nums text-ink-muted sm:table-cell sm:px-4">
          {guests > 0 ? formatMoney(Math.round(budget.totalMinor / guests), currency) : '-'}
        </td>
        <td className="hidden px-3 py-3 sm:table-cell sm:px-4" />
        <td className="hidden px-3 py-3 sm:table-cell sm:px-4" />
      </tr>
    </tfoot>
  );
}

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
      <table className="w-full min-w-0 border-collapse text-sm sm:min-w-[46rem]">
        <caption className="sr-only">
          {t.workspace.allocation}. {t.workspace.allocationHelp}
        </caption>
        <BudgetTableHead t={t} />
        <tbody>
          {budget.categories.map((category) => (
            <BudgetTableRow key={category.id} category={category} currency={currency} />
          ))}
        </tbody>
        <BudgetTableFoot budget={budget} guests={plan.intake.guests} currency={currency} t={t} />
      </table>
    </div>
  );
}
