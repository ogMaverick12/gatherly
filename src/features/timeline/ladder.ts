import { type Plan } from '@/lib/plan';
import { addDays, diffDays, type DateOnly } from '@/lib/dates';
import { LADDER } from './ladder-data';

/**
 * Timeline engine.
 *
 * Works backwards from the event date so the plan tells you what to do next
 * rather than what already happened. All dates are date-only strings, so the
 * ladder never drifts across a timezone boundary.
 */

export interface TimelineMilestone {
  readonly id: string;
  readonly title: string;
  readonly date: DateOnly | null;
  /** Days before the event. Negative for the day itself. */
  readonly offsetDays: number;
  readonly done: boolean;
  readonly owner: string;
  readonly whyItMatters: string;
  readonly critical: boolean;
  /** Human label: "T-90" or the calendar date when one is known. */
  readonly label: string;
}

function relativeLabel(offsetDays: number): string {
  if (offsetDays === 0) return 'Event day';
  if (offsetDays < 0) return `T-${Math.abs(offsetDays)}`;
  return `T+${offsetDays}`;
}

function extraOffsetForGuests(guests: number): number {
  if (guests >= 300) return 60;
  if (guests >= 150) return 30;
  return 0;
}

/**
 * Move the steps that can no longer be done on time to the start of the plan.
 *
 * A plan made today for an event 128 days away still lists "shortlist venues"
 * 180 days before the event. That date has passed, so the step moves to today
 * instead of showing up as overdue the moment the plan is created. The steps
 * keep their order and never move past the first step that is still ahead.
 */
function pullStepsForward(milestones: TimelineMilestone[], today: DateOnly): TimelineMilestone[] {
  const eventMilestone = milestones.find((milestone) => milestone.offsetDays === 0);
  const eventDate = eventMilestone?.date ?? null;
  if (eventDate === null || eventDate <= today) return milestones;

  const nextAhead = milestones.find(
    (milestone) => milestone.date !== null && milestone.date >= today,
  );
  const limit = nextAhead?.date ?? null;

  let pulled = 0;
  return milestones.map((milestone) => {
    if (milestone.date === null || milestone.date >= today) return milestone;
    const candidate = addDays(today, pulled);
    pulled += 1;
    const date = limit !== null && candidate > limit ? limit : candidate;
    const offsetDays = -diffDays(date, eventDate);
    return { ...milestone, date, offsetDays, label: date };
  });
}

export function buildMilestoneLadder(plan: Plan, today: DateOnly): TimelineMilestone[] {
  const { intake } = plan;
  const eventDate = intake.eventDate;
  const venueBooked = plan.vendors.some(
    (vendor) => vendor.category === 'venue' && vendor.status === 'booked',
  );
  const extra = extraOffsetForGuests(intake.guests);

  const ladder = LADDER.filter((item) => {
    if (!item.eventTypes.includes(intake.eventType)) return false;
    if (item.minGuests && intake.guests < item.minGuests) return false;
    if (item.skipUnderGuests && intake.guests < item.skipUnderGuests) return false;
    if (item.onlyIfVenueUnbooked && venueBooked) return false;
    return true;
  }).map((item) => {
    const offset = item.offset === 0 ? 0 : item.offset + extra;
    const date = eventDate ? addDays(eventDate, -offset) : null;
    return {
      id: item.id,
      title: item.title,
      date,
      offsetDays: -offset,
      done: false,
      owner: item.owner,
      whyItMatters: item.why,
      critical: item.critical ?? false,
      label: date ?? relativeLabel(offset),
    };
  });

  return pullStepsForward(ladder, today);
}
