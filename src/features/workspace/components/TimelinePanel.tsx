'use client';

/**
 * The timeline tab: the milestone ladder and the run-of-show table.
 * Both sections read their dates and labels from the computed plan view.
 */

import { Card } from '@/components/ui/Card';
import { useAccessibility } from '@/features/accessibility';
import { todayDateOnly } from '@/lib/dates';
import type { Dictionary } from '@/lib/i18n';
import type { PlanView } from '../plan-view';
import { MilestoneItem } from './MilestoneItem';

/** The dated milestone ladder with completion toggles. */
export function MilestoneList({
  view,
  today,
  t,
  onToggleMilestone,
}: {
  readonly view: PlanView;
  readonly today: string;
  readonly t: Dictionary;
  readonly onToggleMilestone: (id: string) => void;
}) {
  return (
    <section aria-labelledby="milestones-heading">
      <h2 id="milestones-heading" className="font-display text-title">
        {t.workspace.milestones}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">{t.workspace.milestonesHelp}</p>

      {view.milestones.length === 0 ? (
        <Card as="p" padding="md" className="mt-3 text-sm text-ink-muted">
          {t.intake.dateNotSet}
        </Card>
      ) : (
        <ol className="mt-4 space-y-0">
          {view.milestones.map((milestone, index) => (
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              today={today}
              showConnector={index < view.milestones.length - 1}
              t={t}
              onToggle={onToggleMilestone}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

/** The run-of-show table. */
export function RunOfShowTable({ view, t }: { readonly view: PlanView; readonly t: Dictionary }) {
  return (
    <section aria-labelledby="run-of-show-heading">
      <h2 id="run-of-show-heading" className="font-display text-title">
        {t.workspace.runOfShow}
      </h2>
      <p className="mt-1 text-sm text-ink-muted">{t.workspace.runOfShowHelp}</p>
      <Card className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <caption className="sr-only">{t.workspace.runOfShow}</caption>
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="px-4 py-3 font-semibold">
                Time
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                What
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Who
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Where
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {view.runOfShow.map((step) => (
              <tr key={step.id} className="border-b border-line/70 last:border-0 align-top">
                <th scope="row" className="px-4 py-3 text-left font-semibold tabular-nums">
                  {step.time}
                  <span className="block text-xs font-normal text-ink-muted">
                    {step.durationMinutes} {t.common.minutes}
                  </span>
                </th>
                <td className="px-4 py-3">{step.title}</td>
                <td className="px-4 py-3 text-ink-muted">{step.owner}</td>
                <td className="px-4 py-3 text-ink-muted">{step.location}</td>
                <td className="px-4 py-3 text-ink-muted">{step.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

/**
 * Show dated milestones, their deadlines and the run of show.
 * Ticking a milestone reports the id upward; this component never edits the plan.
 */
export function TimelinePanel({
  view,
  onToggleMilestone,
}: {
  view: PlanView;
  onToggleMilestone: (id: string) => void;
}) {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const today = todayDateOnly(new Date());

  return (
    <div className="space-y-6">
      <MilestoneList view={view} today={today} t={t} onToggleMilestone={onToggleMilestone} />
      <RunOfShowTable view={view} t={t} />
    </div>
  );
}
