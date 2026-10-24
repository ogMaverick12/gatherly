import { type EventType, type Milestone, type Plan } from '@/lib/plan';
import { addDays, diffDays, type DateOnly } from '@/lib/dates';

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

interface LadderItem {
  readonly id: string;
  readonly title: string;
  readonly offset: number;
  readonly why: string;
  readonly owner: string;
  readonly eventTypes: readonly EventType[];
  readonly critical?: boolean;
  readonly minGuests?: number;
  readonly onlyIfVenueUnbooked?: boolean;
  readonly skipUnderGuests?: number;
}

const LADDER: readonly LadderItem[] = [
  {
    id: 'venue-shortlist',
    title: 'Shortlist venues and hold the best one',
    offset: 180,
    why: 'Good venues run out months ahead, and a written hold buys you time to compare.',
    owner: 'You',
    eventTypes: ['wedding', 'community'],
    critical: true,
  },
  {
    id: 'venue-hold',
    title: 'Put a written hold on the venue',
    offset: 150,
    why: 'A hold keeps the date alive while you line up the rest.',
    owner: 'You',
    eventTypes: ['wedding', 'community'],
    critical: true,
    onlyIfVenueUnbooked: true,
  },
  {
    id: 'vendor-shortlist',
    title: 'Contact every vendor on the shortlist',
    offset: 120,
    why: 'Quotes expire, and a vendor who is free on your date is worth more than a cheaper one.',
    owner: 'You',
    eventTypes: ['wedding', 'birthday', 'community'],
    critical: true,
  },
  {
    id: 'catering-tasting',
    title: 'Taste the food before you pay',
    offset: 90,
    why: 'One tasting prevents most menu regrets.',
    owner: 'You',
    eventTypes: ['wedding', 'birthday', 'community'],
    skipUnderGuests: 30,
  },
  {
    id: 'decor-confirm',
    title: 'Lock decor, flowers and lighting',
    offset: 60,
    why: 'Fresh flowers and lighting hire are booked by the week, not the day.',
    owner: 'You',
    eventTypes: ['wedding', 'birthday'],
  },
  {
    id: 'transport-plan',
    title: 'Arrange guest travel and parking',
    offset: 45,
    why: 'Guests care more about arriving than about arriving in style.',
    owner: 'You',
    eventTypes: ['wedding', 'community'],
  },
  {
    id: 'final-numbers',
    title: 'Confirm the final guest list',
    offset: 30,
    why: 'Every number you change after this costs money in catering, seating and print.',
    owner: 'You',
    eventTypes: ['wedding', 'birthday', 'community'],
    critical: true,
  },
  {
    id: 'run-of-show',
    title: 'Write the run of show and share it',
    offset: 21,
    why: 'A shared run of show turns a long day into a short list of calm moments.',
    owner: 'You',
    eventTypes: ['wedding', 'birthday', 'community'],
  },
  {
    id: 'final-payments',
    title: 'Make the final payments',
    offset: 14,
    why: 'Paying on time is how you keep a vendor available if something changes.',
    owner: 'You',
    eventTypes: ['wedding', 'birthday', 'community'],
  },
  {
    id: 'seating-signage',
    title: 'Plan seating, signage and the guest map',
    offset: 7,
    why: 'Seating is where a host spends the most energy. Decide it early.',
    owner: 'You',
    eventTypes: ['wedding', 'birthday', 'community'],
  },
  {
    id: 'dietary-sheet',
    title: 'Send the final headcount and dietary sheet',
    offset: 3,
    why: 'Caterers need exact numbers, including for the guests nobody counted.',
    owner: 'You',
    eventTypes: ['wedding', 'birthday', 'community'],
    critical: true,
  },
  {
    id: 'kit-check',
    title: 'Kit check: rings, keys, envelopes, first aid',
    offset: 1,
    why: 'A small bag of small things prevents the most common disasters.',
    owner: 'You',
    eventTypes: ['wedding', 'birthday', 'community'],
  },
  {
    id: 'event-day',
    title: 'Event day',
    offset: 0,
    why: 'Everything else was for this.',
    owner: 'You',
    eventTypes: ['wedding', 'birthday', 'community'],
    critical: true,
  },
] as const;

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

/* ------------------------------------------------------------------ *
 * Run of show
 * ------------------------------------------------------------------ */

export interface RunOfShowStep {
  readonly id: string;
  readonly time: string;
  readonly durationMinutes: number;
  readonly title: string;
  readonly owner: string;
  readonly location: string;
  readonly notes: string;
}

interface RunOfShowTemplate {
  readonly id: string;
  readonly start: string;
  readonly durationMinutes: number;
  readonly title: string;
  readonly owner: string;
  readonly location: string;
  readonly notes: string;
}

const RUN_OF_SHOW: Record<EventType, readonly RunOfShowTemplate[]> = {
  wedding: [
    {
      id: 'setup',
      start: '07:00',
      durationMinutes: 120,
      title: 'Setup, flowers, sound check',
      owner: 'Decor and venue',
      location: 'Venue',
      notes: 'Test the microphone and the music inputs.',
    },
    {
      id: 'vendors-arrive',
      start: '09:00',
      durationMinutes: 60,
      title: 'Vendors arrive, kit check',
      owner: 'You',
      location: 'Back room',
      notes: 'Rings, keys, envelopes, first aid.',
    },
    {
      id: 'guests-arrive',
      start: '10:00',
      durationMinutes: 90,
      title: 'Guests arrive, welcome drink',
      owner: 'Hosts',
      location: 'Welcome area',
      notes: 'Seating plan at the entrance.',
    },
    {
      id: 'ceremony',
      start: '11:30',
      durationMinutes: 75,
      title: 'Ceremony',
      owner: 'Officiant',
      location: 'Ceremony space',
      notes: 'Keep this to the plan; do not extend it.',
    },
    {
      id: 'photos',
      start: '12:45',
      durationMinutes: 60,
      title: 'Family photographs',
      owner: 'Photographer',
      location: 'Garden or foyer',
      notes: 'Group list ready, printed.',
    },
    {
      id: 'lunch',
      start: '14:00',
      durationMinutes: 120,
      title: 'Lunch service',
      owner: 'Caterer',
      location: 'Dining area',
      notes: 'Serve dietary meals first, unmarked plates to the table.',
    },
    {
      id: 'quiet-hour',
      start: '16:00',
      durationMinutes: 60,
      title: 'Quiet hour for elders and rest',
      owner: 'Hosts',
      location: 'Side room',
      notes: 'Water, seating, low light, no music.',
    },
    {
      id: 'reception-start',
      start: '17:00',
      durationMinutes: 60,
      title: 'Reception opens, drinks and canapes',
      owner: 'Hosts',
      location: 'Reception area',
      notes: 'Welcome speech ready.',
    },
    {
      id: 'dinner',
      start: '18:00',
      durationMinutes: 120,
      title: 'Dinner service',
      owner: 'Caterer',
      location: 'Dining area',
      notes: 'Cake after the main course.',
    },
    {
      id: 'speeches',
      start: '20:00',
      durationMinutes: 45,
      title: 'Speeches and the couple dance',
      owner: 'Hosts',
      location: 'Reception area',
      notes: 'Three speakers, five minutes each.',
    },
    {
      id: 'farewell',
      start: '21:30',
      durationMinutes: 60,
      title: 'Farewell and transport home',
      owner: 'Transport',
      location: 'Entrance',
      notes: 'Keep taxis booked for the whole window.',
    },
  ],
  birthday: [
    {
      id: 'setup',
      start: '10:00',
      durationMinutes: 90,
      title: 'Setup, table, cake table',
      owner: 'Hosts',
      location: 'Venue',
      notes: 'Chairs, shade, drinks station.',
    },
    {
      id: 'guests-arrive',
      start: '12:00',
      durationMinutes: 45,
      title: 'Guests arrive, welcome drink',
      owner: 'Hosts',
      location: 'Garden',
      notes: 'Music at a level people can talk over.',
    },
    {
      id: 'photos',
      start: '12:45',
      durationMinutes: 40,
      title: 'Photographs',
      owner: 'Photographer',
      location: 'Garden',
      notes: 'Family first, then guests at their leisure.',
    },
    {
      id: 'food',
      start: '13:30',
      durationMinutes: 90,
      title: 'Food service',
      owner: 'Caterer',
      location: 'Dining area',
      notes: 'Cake after the main course, not before.',
    },
    {
      id: 'games',
      start: '15:00',
      durationMinutes: 60,
      title: 'Games and the cake',
      owner: 'Hosts',
      location: 'Lawn',
      notes: 'Keep it short and let people talk.',
    },
    {
      id: 'last-call',
      start: '16:30',
      durationMinutes: 30,
      title: 'Last call and thank yous',
      owner: 'Hosts',
      location: 'Dining area',
      notes: 'Thank each guest at the door.',
    },
  ],
  community: [
    {
      id: 'setup',
      start: '08:00',
      durationMinutes: 150,
      title: 'Setup: tables, kitchen, signage',
      owner: 'Volunteers',
      location: 'Hall',
      notes: 'Check the step-free route and the hearing loop.',
    },
    {
      id: 'food-arrives',
      start: '10:30',
      durationMinutes: 90,
      title: 'Dishes arrive from contributors',
      owner: 'Kitchen team',
      location: 'Kitchen',
      notes: 'Label every dish with its contributor.',
    },
    {
      id: 'doors',
      start: '12:00',
      durationMinutes: 60,
      title: 'Doors open, welcome and seating',
      owner: 'Hosts',
      location: 'Hall',
      notes: 'Volunteers at the door with the seating plan.',
    },
    {
      id: 'shared-meal',
      start: '13:00',
      durationMinutes: 120,
      title: 'Shared meal service',
      owner: 'Kitchen team',
      location: 'Hall',
      notes: 'Serve the shared dishes first.',
    },
    {
      id: 'music',
      start: '15:00',
      durationMinutes: 90,
      title: 'Music, stories and the long table',
      owner: 'Hosts',
      location: 'Hall',
      notes: 'A quiet moment for elders in the middle.',
    },
    {
      id: 'close',
      start: '16:30',
      durationMinutes: 45,
      title: 'Close, thanks and clean-up rota',
      owner: 'Volunteers',
      location: 'Hall',
      notes: 'Leave the hall the way you found it.',
    },
  ],
};

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
