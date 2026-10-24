'use client';

import { useAccessibility } from '@/features/accessibility/provider';
import type { PlanView } from '@/lib/plan-view';
import { formatMinor } from '@/lib/money';

export function BudgetPanel({ view }: { view: PlanView }) {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const { budget, plan, scenarios } = view;
  const currency = plan.intake.currency;

  return (
    <div className="space-y-6">
      <section aria-labelledby="allocation-heading">
        <h2 id="allocation-heading" className="font-display text-title">
          {t.workspace.allocation}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{t.workspace.allocationHelp}</p>

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
                <td className="px-4 py-3 text-right tabular-nums">
                  {budget.math.contingencyPercent}%
                </td>
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
      </section>

      <section aria-labelledby="warnings-heading">
        <h2 id="warnings-heading" className="font-display text-title">
          {t.workspace.warnings}
        </h2>
        {budget.warnings.length === 0 ? (
          <p className="mt-3 rounded-card border border-line bg-raised p-4 text-sm text-ink-muted">
            {t.workspace.noWarnings}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {budget.warnings.map((warning) => (
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
                    {formatMinor(scenario.committedMinor, currency)}
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
                    {formatMinor(scenario.deltaVsBaseMinor, currency)}
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
    </div>
  );
}
