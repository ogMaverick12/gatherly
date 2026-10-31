import { z } from 'zod';
import type { BudgetCategoryId } from './categories';

/**
 * Optional packs.
 *
 * Packs are starting points a user explicitly opts into. They are never
 * inferred from names, cuisine, language or geography.
 */

export const PACK_IDS = [
  'mehendi-haldi',
  'sangeet-evening',
  'cocktail-hour',
  'community-feast',
  'potluck',
  'street-food-style',
  'carnival-procession',
  'plant-based-feast',
] as const;
/**
 * The pack id enum, derived from `PACK_IDS`.
 */
export const PackIdSchema = z.enum(PACK_IDS);
/** The stable id of a tradition pack. */
export type PackId = z.infer<typeof PackIdSchema>;

/** The data for one selectable tradition pack. */
export interface PackDefinition {
  readonly id: PackId;
  readonly name: string;
  readonly blurb: string;
  /** Extra checklist items the pack contributes to a plan. */
  readonly addsTasks: readonly string[];
  /** Percentage points moved to a category when the pack is selected. */
  readonly budgetShift: Readonly<Partial<Record<BudgetCategoryId, number>>>;
}

/**
 * The full definition of every optional pack, keyed by id.
 */
export const PACKS: Record<PackId, PackDefinition> = {
  'mehendi-haldi': {
    id: 'mehendi-haldi',
    name: 'Mehendi & haldi evenings',
    blurb: 'Two informal evenings before the main day, with henna, light seating and music.',
    addsTasks: [
      'Book a henna artist for the chosen evening',
      'Agree a dress code for the daytime functions',
      'Plan light snacks and a non-alcoholic welcome drink',
    ],
    budgetShift: { music: 2, catering: 1 },
  },
  'sangeet-evening': {
    id: 'sangeet-evening',
    name: 'Sangeet-style evening',
    blurb: 'An evening of coordinated performances, with a rehearsal slot booked.',
    addsTasks: [
      'Book a rehearsal slot for performers',
      'Agree a host, anchor and music playlist',
      'Arrange a cake and a late-evening snack service',
    ],
    budgetShift: { music: 2, entertainment: 2 },
  },
  'cocktail-hour': {
    id: 'cocktail-hour',
    name: 'Cocktail hour',
    blurb: 'A standing reception before the meal, with light bites and a short welcome.',
    addsTasks: [
      'Confirm a welcome drink menu and non-alcoholic pairing',
      'Plan seating for guests who need chairs during the hour',
      'Brief the venue on the welcome and the order of the evening',
    ],
    budgetShift: { catering: 2, stationery: 1 },
  },
  'community-feast': {
    id: 'community-feast',
    name: 'Community feast',
    blurb: 'A shared meal where several households contribute dishes or funds.',
    addsTasks: [
      'Confirm who is bringing which dish and when it arrives',
      'Collect dietary notes alongside dish contributions',
      'Agree the seating and serving order for the meal',
    ],
    budgetShift: { catering: 3, entertainment: 1 },
  },
  potluck: {
    id: 'potluck',
    name: 'Potluck',
    blurb: 'A low-cost gathering where guests bring a dish and a small contribution.',
    addsTasks: [
      'Collect dish contributions and label who brought what',
      'Agree the contribution amount and payment method',
      'Plan serving equipment for a shared table',
    ],
    budgetShift: { catering: -2, venue: -1, entertainment: 1 },
  },
  'street-food-style': {
    id: 'street-food-style',
    name: 'Street-food stalls',
    blurb: 'Several small food counters instead of a plated meal.',
    addsTasks: [
      'Confirm stall providers, power and water access',
      'Plan a waste and cleaning arrangement',
      'Agree the serving flow to keep queues short',
    ],
    budgetShift: { catering: 2, entertainment: 1 },
  },
  'carnival-procession': {
    id: 'carnival-procession',
    name: 'Carnival procession',
    blurb: 'An outdoor moving celebration with decorated vehicles or floats.',
    addsTasks: [
      'Confirm the route and the marshalling points',
      'Arrange noise permissions and a quiet window',
      'Plan water, shade and first aid along the route',
    ],
    budgetShift: { transport: 2, entertainment: 2 },
  },
  'plant-based-feast': {
    id: 'plant-based-feast',
    name: 'Plant-based feast',
    blurb: 'A fully plant-based menu for the whole event, not just a side option.',
    addsTasks: [
      'Confirm the caterer can run a fully plant-based menu',
      'Check the dessert options for dairy and egg substitutes',
      'Plan a tasting of the plant-based menu',
    ],
    budgetShift: { catering: 1 },
  },
};

/**
 * The sentence shown wherever packs are offered or listed.
 */
export const PACK_DISCLAIMER =
  'Packs are optional starting points. Confirm the details with family, elders, officiants or local organisers before you rely on them.';
