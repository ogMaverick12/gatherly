'use client';

/**
 * The workspace header with the plan's headline figures and export controls.
 * Clearing the plan is confirmed first and is the only destructive action here.
 */

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { SectionLabel } from '@/components/ui/SectionLabel';
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
            <SectionLabel tone="teal" spacing="widest">
              {t.workspace.planTitle}
            </SectionLabel>
            {sample ? <Chip tone="teal">{t.workspace.sampleBadge}</Chip> : null}
          </div>
          <h1 className="mt-1 font-display text-title-lg">
            {view.plan.intake.guests} {t.workspace.guests.toLowerCase()}
            {view.plan.intake.eventDate
              ? ` - ${formatDateOnly(view.plan.intake.eventDate, preferences.language)}`
              : ''}
          </h1>
          <ul className="mt-3 flex flex-wrap gap-2 text-xs text-ink-muted">
            <li>
              <Chip tone="outline">
                {t.workspace.budget}: {formatMoney(view.budget.totalMinor, currency)}
              </Chip>
            </li>
            <li>
              <Chip tone="outline">
                {t.workspace.perGuest}:{' '}
                {formatMoney(
                  plan.intake.guests > 0
                    ? Math.round(view.budget.totalMinor / plan.intake.guests)
                    : 0,
                  currency,
                )}
              </Chip>
            </li>
            <li>
              <Chip tone="outline">
                {t.workspace.coverage}: {view.coverage.overallPercent}%
              </Chip>
            </li>
            {view.timeline.daysToEvent !== null ? (
              <li>
                <Chip tone="outline">
                  {view.timeline.daysToEvent} {t.common.days}
                </Chip>
              </li>
            ) : null}
          </ul>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-start">
          <ExportBar view={view} />
          <Button
            onClick={() => {
              if (window.confirm(t.workspace.clearConfirm)) onClear();
            }}
            variant="quiet"
            tone="danger"
            size="none"
            className="underline-offset-4 hover:underline"
          >
            {sample ? t.workspace.startFresh : t.workspace.clearPlan}
          </Button>
        </div>
      </div>
      <OfflineBanner />
    </header>
  );
}
