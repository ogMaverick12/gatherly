import type { Intake } from './schemas';

/**
 * The intake each sample template starts from. Module-private data: the app
 * only ever reads it through SAMPLE_PLAN_TEMPLATES.
 */

/** A mid-size wedding in a tier 2 city, priced in Indian rupees. */
export const WEDDING_INTAKE: Intake = {
  eventType: 'wedding',
  eventDate: null,
  guests: 180,
  cityTier: 'tier2',
  currency: 'INR',
  budgetMinor: 150_000_000,
  priorities: ['food', 'photography', 'guest-experience'],
  cultureNote: '',
  dietary: ['vegetarian'],
  access: ['reserved-seating', 'rest-area'],
  language: 'en',
  packs: [],
  venueType: 'mixed',
  guestCountIsEstimate: true,
  notes: 'A daytime ceremony with an evening reception.',
};

/** A tier 1 city birthday in US dollars with a nut-free requirement. */
export const BIRTHDAY_INTAKE: Intake = {
  eventType: 'birthday',
  eventDate: null,
  guests: 60,
  cityTier: 'tier1',
  currency: 'USD',
  budgetMinor: 1_200_000,
  priorities: ['photography', 'food', 'decor'],
  cultureNote: '',
  dietary: ['vegetarian', 'nut-free'],
  access: ['step-free'],
  language: 'en',
  packs: [],
  venueType: 'indoor',
  guestCountIsEstimate: false,
  notes: 'An afternoon garden party that moves indoors at sunset.',
};

/** A neighbourhood feast in pounds, with a shared-meal pack selected. */
export const COMMUNITY_INTAKE: Intake = {
  eventType: 'community',
  eventDate: null,
  guests: 240,
  cityTier: 'tier3',
  currency: 'GBP',
  budgetMinor: 600_000,
  priorities: ['guest-experience', 'logistics', 'sustainability'],
  cultureNote: '',
  dietary: ['vegetarian', 'halal', 'gluten-free'],
  access: ['wheelchair', 'hearing-loop'],
  language: 'en',
  packs: ['community-feast'],
  venueType: 'indoor',
  guestCountIsEstimate: true,
  notes: 'A neighbourhood gathering with shared tables and a shared kitchen.',
};
