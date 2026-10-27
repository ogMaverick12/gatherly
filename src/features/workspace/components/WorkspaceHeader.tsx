'use client';

import { useAccessibility } from '@/features/accessibility/provider';
import { formatDateOnly } from '@/lib/dates';
import { formatMinor } from '@/lib/money';
import type { Plan } from '@/lib/plan';
import type { PlanView } from '@/lib/plan-view';
import { OfflineBanner } from '@/features/accessibility/components/OfflineBanner';
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

  return (
    <header className="no-print">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
            {t.workspace.planTitle}
          </p>
          <h1 className="mt-1 font-display text-title-lg">
            {view.plan.intake.guests} {t.workspace.guests.toLowerCase()}
            {view.plan.intake.eventDate
              ? ` - ${formatDateOnly(view.plan.intake.eventDate, preferences.language)}`
              : ''}
          </h1>
          <ul className="mt-3 flex flex-wrap gap-2 text-xs text-ink-muted">
            <li className="rounded-pill border border-line px-3 py-1">
              {t.workspace.budget}: {formatMinor(view.budget.totalMinor, currency)}
            </li>
            <li className="rounded-pill border border-line px-3 py-1">
              {t.workspace.perGuest}:{' '}
              {formatMinor(
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
        <div className="flex flex-col items-start gap-3">
          <ExportBar view={view} />
          <button
            type="button"
            onClick={() => {
              if (window.confirm(t.workspace.clearConfirm)) onClear();
            }}
            className="text-sm text-ink-muted underline-offset-4 hover:text-rose hover:underline"
          >
            {t.workspace.clearPlan}
          </button>
        </div>
      </div>
      <OfflineBanner />
    </header>
  );
}
