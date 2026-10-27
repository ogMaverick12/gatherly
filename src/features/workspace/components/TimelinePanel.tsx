'use client';

import { useAccessibility } from '@/features/accessibility/provider';
import type { PlanView } from '@/lib/plan-view';
import { formatDateOnly, todayDateOnly } from '@/lib/dates';

function relativeLabel(offsetDays: number): string {
  if (offsetDays === 0) return 'T';
  return offsetDays < 0 ? `T-${Math.abs(offsetDays)}` : `T+${offsetDays}`;
}

// long-function: one view section, kept in one block so its reading order stays visible.
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
      <section aria-labelledby="milestones-heading">
        <h2 id="milestones-heading" className="font-display text-title">
          {t.workspace.milestones}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{t.workspace.milestonesHelp}</p>

        {view.milestones.length === 0 ? (
          <p className="mt-3 rounded-card border border-line bg-raised p-4 text-sm text-ink-muted">
            {t.intake.dateNotSet}
          </p>
        ) : (
          <ol className="mt-4 space-y-0">
            {view.milestones.map((milestone, index) => {
              const overdue = !milestone.done && milestone.date !== null && milestone.date < today;
              return (
                <li key={milestone.id} className="relative flex gap-4 pb-5 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-teal bg-paper"
                      style={milestone.done ? { backgroundColor: 'var(--color-teal)' } : undefined}
                    />
                    {index < view.milestones.length - 1 ? (
                      <span aria-hidden="true" className="mt-1 w-px flex-1 bg-line" />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <label
                      htmlFor={`milestone-${milestone.id}`}
                      className="grid cursor-pointer grid-cols-[auto_1fr] items-start gap-x-3"
                    >
                      <input
                        id={`milestone-${milestone.id}`}
                        type="checkbox"
                        checked={milestone.done}
                        onChange={() => onToggleMilestone(milestone.id)}
                        className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-teal)]"
                      />
                      <span
                        className={`font-medium ${
                          milestone.done ? 'text-ink-muted line-through' : 'text-ink'
                        }`}
                      >
                        {milestone.title}
                      </span>
                      <span className="col-start-2 mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                        <span className="rounded-pill bg-line/60 px-2 py-0.5 font-semibold text-ink">
                          {relativeLabel(milestone.offsetDays)}
                        </span>
                        {milestone.date ? (
                          <span>{formatDateOnly(milestone.date)}</span>
                        ) : (
                          <span>{t.intake.dateNotSet}</span>
                        )}
                        {milestone.critical ? (
                          <span className="rounded-pill bg-rose/10 px-2 py-0.5 font-semibold text-rose">
                            critical
                          </span>
                        ) : null}
                        {overdue ? (
                          <span className="rounded-pill bg-marigold/25 px-2 py-0.5 font-semibold text-ink">
                            {t.workspace.overdue}
                          </span>
                        ) : null}
                      </span>
                    </label>
                    <p className="mt-1.5 pl-8 text-sm text-ink-muted">{milestone.whyItMatters}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section aria-labelledby="run-of-show-heading">
        <h2 id="run-of-show-heading" className="font-display text-title">
          {t.workspace.runOfShow}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{t.workspace.runOfShowHelp}</p>
        <div className="mt-3 overflow-x-auto rounded-card border border-line bg-raised">
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
        </div>
      </section>
    </div>
  );
}
