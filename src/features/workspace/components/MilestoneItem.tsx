'use client';

/**
 * One milestone row in the timeline ladder.
 */

import { Chip } from '@/components/ui/Chip';
import { formatDateOnly } from '@/lib/dates';
import type { Dictionary } from '@/lib/i18n';
import type { PlanView } from '../plan-view';

function relativeLabel(offsetDays: number): string {
  if (offsetDays === 0) return 'T';
  return offsetDays < 0 ? `T-${Math.abs(offsetDays)}` : `T+${offsetDays}`;
}

/**
 * Render one dated milestone with its connector, toggle and status badges.
 * @param props the milestone, today, connector flag, dictionary and toggle callback
 * @returns the milestone list item
 */
export function MilestoneItem({
  milestone,
  today,
  showConnector,
  t,
  onToggle,
}: {
  readonly milestone: PlanView['milestones'][number];
  readonly today: string;
  readonly showConnector: boolean;
  readonly t: Dictionary;
  readonly onToggle: (id: string) => void;
}) {
  const overdue = !milestone.done && milestone.date !== null && milestone.date < today;
  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      <div className="flex flex-col items-center">
        <span
          aria-hidden="true"
          className="mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 border-teal bg-paper"
          style={milestone.done ? { backgroundColor: 'var(--color-teal)' } : undefined}
        />
        {showConnector ? <span aria-hidden="true" className="mt-1 w-px flex-1 bg-line" /> : null}
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
            onChange={() => onToggle(milestone.id)}
            className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-teal)]"
          />
          <span
            className={`font-medium ${milestone.done ? 'text-ink-muted line-through' : 'text-ink'}`}
          >
            {milestone.title}
          </span>
          <span className="col-start-2 mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <Chip tone="strong" size="inline">
              {relativeLabel(milestone.offsetDays)}
            </Chip>
            {milestone.date ? (
              <span>{formatDateOnly(milestone.date)}</span>
            ) : (
              <span>{t.intake.dateNotSet}</span>
            )}
            {milestone.critical ? (
              <Chip tone="danger" size="inline">
                critical
              </Chip>
            ) : null}
            {overdue ? (
              <Chip tone="warning" size="inline">
                {t.workspace.overdue}
              </Chip>
            ) : null}
          </span>
        </label>
        <p className="mt-1.5 pl-8 text-sm text-ink-muted">{milestone.whyItMatters}</p>
      </div>
    </li>
  );
}
