'use client';

/**
 * The overview tab: six headline figures followed by risks, tasks and catering.
 * The panel only arranges the sections; every number arrives already computed.
 */

import { useAccessibility } from '@/features/accessibility';
import { formatDateOnly } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import type { PlanView } from '../plan-view';
import { CateringSummary } from './overview/CateringSummary';
import { RiskList } from './overview/RiskList';
import { StatCard } from './overview/StatCard';
import { TaskList } from './overview/TaskList';

/** The overview tab: the six figures, then the risks, the tasks and catering. */
export function OverviewPanel({
  view,
  onToggleTask,
}: {
  view: PlanView;
  onToggleTask: (id: string) => void;
}) {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const { plan, budget, coverage, timeline, catering, risks, health } = view;
  const currency = plan.intake.currency;
  const daysToEvent = timeline.daysToEvent;

  return (
    <div className="space-y-4 sm:space-y-6">
      <ul data-testid="overview-stats" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        <li>
          <StatCard
            label={t.workspace.guests}
            value={String(plan.intake.guests)}
            hint={
              plan.intake.guestCountIsEstimate
                ? t.intake.guestCountIsEstimate
                : `${catering.totalPlates} plates including the 8% buffer`
            }
          />
        </li>
        <li>
          <StatCard
            label={t.workspace.date}
            value={plan.intake.eventDate ? formatDateOnly(plan.intake.eventDate) : t.common.unknown}
            hint={
              daysToEvent === null ? t.intake.dateNotSet : `${daysToEvent} ${t.common.days} to go`
            }
          />
        </li>
        <li>
          <StatCard
            label={t.workspace.budget}
            value={formatMoney(budget.totalMinor, currency)}
            hint={`${formatMoney(budget.contingencyMinor, currency)} held back as a contingency`}
          />
        </li>
        <li>
          <StatCard
            label={t.workspace.coverage}
            value={`${coverage.overallPercent}%`}
            hint={coverage.nextAction ?? t.workspace.vendorsChecklist}
          />
        </li>
        <li>
          <StatCard
            label={t.workspace.milestones}
            value={`${timeline.done}/${timeline.total}`}
            hint={
              timeline.overdue > 0
                ? `${timeline.overdue} ${t.workspace.overdue.toLowerCase()}`
                : t.workspace.milestonesHelp
            }
          />
        </li>
        <li>
          <StatCard
            label={t.workspace.health}
            value={`${health.score}/100`}
            hint={t.workspace.healthExplainer}
          />
        </li>
      </ul>

      <RiskList risks={risks} />
      <TaskList tasks={plan.tasks} onToggleTask={onToggleTask} />
      <CateringSummary catering={catering} />
    </div>
  );
}
