'use client';

/**
 * The task checklist on the overview tab.
 * Ticking a task reports its id upward; the workspace hook updates the plan and health score.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAccessibility } from '@/features/accessibility';
import type { PlanTask } from '@/lib/plan';

/** Phones show the first few tasks; the rest are one disclosure away. */
const PHONE_TASK_LIMIT = 3;

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
        <Card as="p" padding="md" className="mt-3 text-sm text-ink-muted">
          {t.workspace.noPlanCta}
        </Card>
      ) : (
        <ul className="mt-3 space-y-2">
          {tasks.map((task, index) => (
            <li
              key={task.id}
              className={index < PHONE_TASK_LIMIT || expanded ? undefined : 'hidden sm:block'}
            >
              <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-card border border-line bg-raised px-4 py-2.5">
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
        <Button
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
          variant="secondary"
          size="compact"
          className="mt-2 w-full sm:hidden"
        >
          {expanded ? t.workspace.showFewerTasks : t.workspace.showAllTasks}
        </Button>
      ) : null}
    </section>
  );
}
