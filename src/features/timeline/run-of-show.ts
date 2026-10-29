/**
 * The event-day run of show.
 *
 * Each event type has its own ordered template; this module picks the right
 * one and returns plain steps the timeline panel and exports can render.
 */

import type { EventType, Plan } from '@/lib/plan';
import { BIRTHDAY_RUN_OF_SHOW } from './run-of-show/birthday';
import { COMMUNITY_RUN_OF_SHOW } from './run-of-show/community';
import type { RunOfShowTemplate } from './run-of-show/template';
import { WEDDING_RUN_OF_SHOW } from './run-of-show/wedding';

export interface RunOfShowStep {
  readonly id: string;
  readonly time: string;
  readonly durationMinutes: number;
  readonly title: string;
  readonly owner: string;
  readonly location: string;
  readonly notes: string;
}

const RUN_OF_SHOW: Record<EventType, readonly RunOfShowTemplate[]> = {
  wedding: WEDDING_RUN_OF_SHOW,
  birthday: BIRTHDAY_RUN_OF_SHOW,
  community: COMMUNITY_RUN_OF_SHOW,
};

/**
 * Returns the event-day schedule for the plan's event type.
 * @param plan the plan whose event type selects the template
 * @returns the steps in clock order, each with a start `HH:MM` and duration in minutes
 */
export function buildRunOfShow(plan: Plan): RunOfShowStep[] {
  const template = RUN_OF_SHOW[plan.intake.eventType];
  return template.map((step) => ({
    id: step.id,
    time: step.start,
    durationMinutes: step.durationMinutes,
    title: step.title,
    owner: step.owner,
    location: step.location,
    notes: step.notes,
  }));
}
