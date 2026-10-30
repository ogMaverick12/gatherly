/**
 * Milestones a sample plan can start with, keyed by ladder id.
 *
 * They carry just enough text to survive a round-trip through local storage;
 * the timeline merge supplies the real dates when the plan is viewed.
 */

export interface SampleMilestoneSeed {
  readonly id: string;
  readonly title: string;
  readonly offsetDays: number;
  readonly owner: string;
  readonly whyItMatters: string;
}

/** The milestone titles a sample can start with, keyed by ladder id. */
export const SAMPLE_MILESTONE_SEEDS: Record<string, SampleMilestoneSeed> = {
  'venue-shortlist': {
    id: 'venue-shortlist',
    title: 'Shortlist venues and hold the best one',
    offsetDays: 180,
    owner: 'You',
    whyItMatters: 'Good venues run out months ahead, and a written hold buys you time to compare.',
  },
  'vendor-shortlist': {
    id: 'vendor-shortlist',
    title: 'Contact every vendor on the shortlist',
    offsetDays: 120,
    owner: 'You',
    whyItMatters:
      'Quotes expire, and a vendor who is free on your date is worth more than a cheaper one.',
  },
  'catering-tasting': {
    id: 'catering-tasting',
    title: 'Taste the food before you pay',
    offsetDays: 90,
    owner: 'You',
    whyItMatters: 'One tasting prevents most menu regrets.',
  },
  'decor-confirm': {
    id: 'decor-confirm',
    title: 'Lock decor, flowers and lighting',
    offsetDays: 60,
    owner: 'You',
    whyItMatters: 'Fresh flowers and lighting hire are booked by the week, not the day.',
  },
  'transport-plan': {
    id: 'transport-plan',
    title: 'Arrange guest travel and parking',
    offsetDays: 45,
    owner: 'You',
    whyItMatters: 'Guests care more about arriving than about arriving in style.',
  },
};
