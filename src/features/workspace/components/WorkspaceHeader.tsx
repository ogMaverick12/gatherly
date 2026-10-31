'use client';

/**
 * The workspace header with the plan's headline figures and export controls.
 * Clearing the plan is confirmed first and is the only destructive action here.
 */

import { OfflineBanner, useAccessibility } from '@/features/accessibility';
import { formatDateOnly } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { isSamplePlan, type Plan } from '@/lib/plan';
import type { PlanView } from '../plan-view';
import { ExportBar } from './ExportBar';

// long-function: one view section, kept in one block so its reading order stays visible.
/** The plan's headline figures, its exports, and the way to start over. */
export function WorkspaceHeader({
  view,
  plan,
  onClear,
}: {
  view: PlanView;
  plan: Plan;
  onClear: () => void;
}) {
  const { dictionary, preferences } = useAccessibility();
  const t = dictionary;
  const currency = plan.intake.currency;
  const sample = isSamplePlan(plan);

  return (
    <header className="no-print">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
              {t.workspace.planTitle}
            </p>
            {sample ? (
              <span className="rounded-pill border border-teal bg-teal/5 px-3 py-1 text-xs font-semibold text-teal">
                {t.workspace.sampleBadge}
              </span>
            ) : null}
          </div>
          <h1 className="mt-1 font-display text-title-lg">
            {view.plan.intake.guests} {t.workspace.guests.toLowerCase()}
            {view.plan.intake.eventDate
              ? ` - ${formatDateOnly(view.plan.intake.eventDate, preferences.language)}`
              : ''}
          </h1>
          <ul className="mt-3 flex flex-wrap gap-2 text-xs text-ink-muted">
            <li className="rounded-pill border border-line px-3 py-1">
              {t.workspace.budget}: {formatMoney(view.budget.totalMinor, currency)}
            </li>
            <li className="rounded-pill border border-line px-3 py-1">
              {t.workspace.perGuest}:{' '}
              {formatMoney(
                plan.intake.guests > 0
                  ? Math.round(view.budget.totalMinor / plan.intake.guests)
                  : 0,
                currency,
              )}
            </li>
            <li className="rounded-pill border border-line px-3 py-1">
              {t.workspace.coverage}: {view.coverage.overallPercent}%
            </li>
            {view.timeline.daysToEvent !== null ? (
              <li className="rounded-pill border border-line px-3 py-1">
                {view.timeline.daysToEvent} {t.common.days}
              </li>
            ) : null}
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-start">
          <ExportBar view={view} />
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t.workspace.clearConfirm)) onClear();
            }}
            className="inline-flex min-h-[44px] items-center text-sm text-ink-muted underline-offset-4 hover:text-rose hover:underline"
          >
            {sample ? t.workspace.startFresh : t.workspace.clearPlan}
          </button>
        </div>
      </div>
      <OfflineBanner />
    </header>
  );
}
