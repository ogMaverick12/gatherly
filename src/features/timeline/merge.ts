import { type Milestone } from '@/lib/plan';
import { diffDays, type DateOnly } from '@/lib/dates';
import type { TimelineMilestone } from './ladder';

/**
 * Merge a freshly generated ladder with the plan the user already has.
 *
 * The stored dates win: once a plan has been made, its schedule is fixed, so
 * a step becomes overdue when its date passes rather than sliding forward
 * every day.
 */
export function mergeMilestoneState(
  existing: readonly Milestone[],
  ladder: readonly TimelineMilestone[],
): TimelineMilestone[] {
  const byId = new Map(existing.map((milestone) => [milestone.id, milestone]));
  return ladder.map((item) => {
    const previous = byId.get(item.id);
    return {
      ...item,
      date: previous?.date ?? item.date,
      offsetDays: previous?.offsetDays ?? item.offsetDays,
      done: previous?.done ?? false,
    };
  });
}

export interface TimelineSummary {
  readonly milestones: readonly TimelineMilestone[];
  readonly total: number;
  readonly done: number;
  readonly overdue: number;
  readonly nextUp: TimelineMilestone | null;
  readonly daysToEvent: number | null;
}

export function summariseTimeline(
  milestones: readonly TimelineMilestone[],
  today: DateOnly,
): TimelineSummary {
  const done = milestones.filter((milestone) => milestone.done).length;
  const overdue = milestones.filter(
    (milestone) => !milestone.done && milestone.date !== null && milestone.date < today,
  ).length;
  const upcoming = milestones
    .filter((milestone) => !milestone.done)
    .sort((a, b) => (a.date ?? '9999-12-31').localeCompare(b.date ?? '9999-12-31'));
  const nextUp = upcoming[0] ?? null;
  const eventMilestone = milestones.find((milestone) => milestone.offsetDays === 0);
  const eventDate = eventMilestone?.date ?? null;
  const daysToEvent = eventDate !== null ? diffDays(today, eventDate) : null;
  return {
    milestones,
    total: milestones.length,
    done,
    overdue,
    nextUp,
    daysToEvent,
  };
}
