'use client';

/**
 * The task checklist on the overview tab.
 * Ticking a task reports its id upward; the workspace hook updates the plan and health score.
 */

import { useState } from 'react';
import { useAccessibility } from '@/features/accessibility/provider';
import type { PlanTask } from '@/lib/plan';

/** Phones show the first few tasks; the rest are one disclosure away. */
const PHONE_TASK_LIMIT = 3;

// long-function: one view section, kept in one block so its reading order stays visible.
/** The checklist, with the tick that moves the health score. */
export function TaskList({
  tasks,
  onToggleTask,
}: {
  tasks: readonly PlanTask[];
  onToggleTask: (id: string) => void;
}) {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const [expanded, setExpanded] = useState(false);

  return (
    <section aria-labelledby="tasks-heading">
      <h2 id="tasks-heading" className="font-display text-title">
        {t.workspace.nextUp}
      </h2>
      {tasks.length === 0 ? (
        <p className="mt-3 rounded-card border border-line bg-raised p-4 text-sm text-ink-muted">
          {t.workspace.noPlanCta}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {tasks.map((task, index) => (
            <li
              key={task.id}
              className={index < PHONE_TASK_LIMIT || expanded ? undefined : 'hidden sm:block'}
            >
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-card border border-line bg-raised px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => onToggleTask(task.id)}
                  className="h-5 w-5 shrink-0 accent-[var(--color-teal)]"
                />
                <span className={task.done ? 'text-ink-muted line-through' : 'text-ink'}>
                  {task.title}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {tasks.length > PHONE_TASK_LIMIT ? (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center rounded-pill border border-line-strong px-4 py-2 text-sm font-medium text-ink transition-colors duration-200 hover:border-ink hover:bg-raised sm:hidden"
        >
          {expanded ? t.workspace.showFewerTasks : t.workspace.showAllTasks}
        </button>
      ) : null}
    </section>
  );
}
