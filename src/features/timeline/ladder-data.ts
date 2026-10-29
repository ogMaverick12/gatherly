import type { EventType } from '@/lib/plan';

/**
 * The milestone ladder, as data.
 *
 * One entry per step, with the offset in days before the event and the reason
 * it matters. buildMilestoneLadder reads this; nothing here is computed.
 */

export interface LadderItem {
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

/** One entry per step, ordered from the furthest ahead (180 days before) to the event day. */
export const LADDER: readonly LadderItem[] = [
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
