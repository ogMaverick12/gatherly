import type { BudgetCategoryId, EventType, Priority } from '@/lib/plan';

/**
 * The weights the budget engine starts from: what share of the budget each
 * category takes before priorities and packs move anything, what published
 * benchmarks it is compared against, and the thresholds that raise a warning.
 */

/** Starting share of the budget per category, in percentage points, before any adjustment. */
export const BASE_WEIGHTS: Record<EventType, Record<BudgetCategoryId, number>> = {
  wedding: {
    venue: 26,
    catering: 27,
    photography: 11,
    decor: 10,
    music: 5,
    attire: 4,
    transport: 3,
    stationery: 2,
    entertainment: 2,
    officiant: 4,
    accommodation: 4,
    gifts: 2,
  },
  birthday: {
    venue: 22,
    catering: 27,
    photography: 9,
    decor: 13,
    music: 7,
    attire: 3,
    transport: 2,
    stationery: 2,
    entertainment: 8,
    officiant: 0,
    accommodation: 0,
    gifts: 7,
  },
  community: {
    venue: 12,
    catering: 35,
    photography: 4,
    decor: 8,
    music: 4,
    attire: 0,
    transport: 5,
    stationery: 4,
    entertainment: 20,
    officiant: 2,
    accommodation: 0,
    gifts: 6,
  },
};

/**
 * Typical share of a budget for this event type, used only for comparison.
 * These are planning heuristics, not prices, and are published in
 * `docs/ARCHITECTURE.md`.
 */
const BENCHMARK_SHARES: Record<EventType, Record<BudgetCategoryId, number>> = {
  wedding: {
    venue: 26,
    catering: 25,
    photography: 11,
    decor: 10,
    music: 5,
    attire: 4,
    transport: 3,
    stationery: 2,
    entertainment: 3,
    officiant: 4,
    accommodation: 4,
    gifts: 3,
  },
  birthday: {
    venue: 21,
    catering: 24,
    photography: 9,
    decor: 14,
    music: 7,
    attire: 4,
    transport: 3,
    stationery: 2,
    entertainment: 9,
    officiant: 0,
    accommodation: 0,
    gifts: 7,
  },
  community: {
    venue: 11,
    catering: 33,
    photography: 4,
    decor: 7,
    music: 4,
    attire: 0,
    transport: 6,
    stationery: 4,
    entertainment: 21,
    officiant: 2,
    accommodation: 0,
    gifts: 8,
  },
};

/** Which categories a priority pulls money towards. */
export const PRIORITY_CATEGORY_MAP: Record<Priority, readonly BudgetCategoryId[]> = {
  photography: ['photography'],
  food: ['catering'],
  music: ['music'],
  decor: ['decor'],
  logistics: ['transport'],
  'guest-experience': ['catering', 'venue'],
  accessibility: ['venue', 'stationery'],
  sustainability: ['catering', 'stationery'],
  formality: ['attire', 'decor'],
  simplicity: ['entertainment', 'stationery'],
};

/** The boost applied to a prioritised category's weight (15%). */
export const PRIORITY_MULTIPLIER = 1.15;
/** The share of the total held back as contingency, percent 0-100. */
export const CONTINGENCY_PERCENT = 8;

/** Share of spendable budget above which food raises a warning, percent 0-100. */
export const CATERING_HEAVY_PERCENT = 35;
/** Share of budget below which an indoor venue is worth checking, percent 0-100. */
export const VENUE_LIGHT_PERCENT = 20;

/** Categories that scale with the guest count rather than being a flat cost. */
export const PER_GUEST_CATEGORIES: ReadonlySet<BudgetCategoryId> = new Set([
  'venue',
  'catering',
  'decor',
  'transport',
  'stationery',
  'accommodation',
  'gifts',
]);

/**
 * Benchmark shares for an event type, nudged for very large or very small guest counts.
 * @param eventType the event type whose published shares are the base
 * @param guests whole number of guests; 200 or more, or under 50, shifts a few points
 * @returns percent 0-100 per category, for comparison only
 */
export function benchmarkSharesFor(
  eventType: EventType,
  guests: number,
): Record<BudgetCategoryId, number> {
  const base = { ...BENCHMARK_SHARES[eventType] };
  // Larger events spend relatively more on food and service, less on decor.
  if (guests >= 200) {
    base.catering += 4;
    base.venue -= 1;
    base.decor -= 2;
    base.stationery -= 1;
  } else if (guests < 50) {
    base.catering -= 3;
    base.decor += 2;
    base.photography += 1;
  }
  return base;
}
