'use client';

/**
 * The task checklist on the overview tab.
 * Ticking a task reports its id upward; the workspace hook updates the plan and health score.
 */

import { useAccessibility } from '@/features/accessibility/provider';
import type { PlanTask } from '@/lib/plan';

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
          {tasks.map((task) => (
            <li key={task.id}>
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
    </section>
  );
}
