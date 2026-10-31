import { z } from 'zod';

/**
 * The vocabularies a plan is described with: what kind of event it is, where it
 * is held, and what the household says it cares about. Data and schemas only -
 * nothing here imports from `src/features`, so feature services can depend on
 * it without creating a cycle.
 */

export const EVENT_TYPES = ['wedding', 'birthday', 'community'] as const;
/**
 * The event type enum, derived from `EVENT_TYPES`.
 */
export const EventTypeSchema = z.enum(EVENT_TYPES);
/** A celebration type the planner supports. */
export type EventType = z.infer<typeof EventTypeSchema>;

/**
 * Human-readable labels for each event type.
 */
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Wedding',
  birthday: 'Birthday',
  community: 'Community gathering',
};

/**
 * The city tiers used to judge typical budget shares.
 */
export const CITY_TIERS = ['tier1', 'tier2', 'tier3'] as const;
/**
 * The city tier enum, derived from `CITY_TIERS`.
 */
export const CityTierSchema = z.enum(CITY_TIERS);
/** The cost tier of the event city. */
export type CityTier = z.infer<typeof CityTierSchema>;

/**
 * Human-readable labels for each city tier.
 */
export const CITY_TIER_LABELS: Record<CityTier, string> = {
  tier1: 'Tier 1 city (major metro)',
  tier2: 'Tier 2 city (regional centre)',
  tier3: 'Tier 3 city (smaller town)',
};

/**
 * The languages the interface is translated into.
 */
export const LANGUAGES = ['en', 'hi', 'bn'] as const;
/**
 * The language enum, derived from `LANGUAGES`.
 */
export const LanguageSchema = z.enum(LANGUAGES);
/** A supported interface language. */
export type Language = z.infer<typeof LanguageSchema>;

/**
 * The name of each language, written in that language.
 */
export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी',
  bn: 'বাংলা',
};

/**
 * The priorities a household can choose to shift the budget towards.
 */
export const PRIORITIES = [
  'photography',
  'food',
  'music',
  'decor',
  'logistics',
  'guest-experience',
  'accessibility',
  'sustainability',
  'formality',
  'simplicity',
] as const;
/**
 * The priority enum, derived from `PRIORITIES`.
 */
export const PrioritySchema = z.enum(PRIORITIES);
/** How much a planning item matters to the user. */
export type Priority = z.infer<typeof PrioritySchema>;

/**
 * Human-readable labels for each priority.
 */
export const PRIORITY_LABELS: Record<Priority, string> = {
  photography: 'Photography & film',
  food: 'Food & drink',
  music: 'Music & sound',
  decor: 'Decor & flowers',
  logistics: 'Logistics & travel',
  'guest-experience': 'Guest comfort',
  accessibility: 'Accessibility',
  sustainability: 'Sustainability',
  formality: 'Formality & tradition',
  simplicity: 'Simplicity & ease',
};

/**
 * The dietary needs a plan can record for the caterer.
 */
export const DIETARY_NEEDS = [
  'vegan',
  'vegetarian',
  'halal',
  'kosher',
  'gluten-free',
  'nut-free',
  'dairy-free',
  'egg-free',
  'low-sodium',
  'diabetic',
] as const;
/**
 * The dietary need enum, derived from `DIETARY_NEEDS`.
 */
export const DietaryNeedSchema = z.enum(DIETARY_NEEDS);
/** A dietary requirement a guest may have. */
export type DietaryNeed = z.infer<typeof DietaryNeedSchema>;

/**
 * Human-readable labels for each dietary need.
 */
export const DIETARY_LABELS: Record<DietaryNeed, string> = {
  vegan: 'Vegan',
  vegetarian: 'Vegetarian',
  halal: 'Halal',
  kosher: 'Kosher',
  'gluten-free': 'Gluten free',
  'nut-free': 'Nut free',
  'dairy-free': 'Dairy free',
  'egg-free': 'Egg free',
  'low-sodium': 'Low sodium',
  diabetic: 'Diabetic friendly',
};

/**
 * The access needs a plan can record and turn into tasks.
 */
export const ACCESS_NEEDS = [
  'wheelchair',
  'step-free',
  'hearing-loop',
  'captioning',
  'quiet-room',
  'reserved-seating',
  'rest-area',
  'service-animal',
] as const;
/**
 * The access need enum, derived from `ACCESS_NEEDS`.
 */
export const AccessNeedSchema = z.enum(ACCESS_NEEDS);
/** An accessibility need a guest may have. */
export type AccessNeed = z.infer<typeof AccessNeedSchema>;

/**
 * Human-readable labels for each access need.
 */
export const ACCESS_LABELS: Record<AccessNeed, string> = {
  wheelchair: 'Wheelchair access',
  'step-free': 'Step-free routes',
  'hearing-loop': 'Hearing loop',
  captioning: 'Captioning / sign support',
  'quiet-room': 'Quiet room',
  'reserved-seating': 'Reserved seating',
  'rest-area': 'Rest area for elders',
  'service-animal': 'Service animals welcome',
};

/**
 * The venue settings a plan can choose between.
 */
export const VENUE_TYPES = ['indoor', 'outdoor', 'mixed', 'unset'] as const;
/**
 * The venue type enum, derived from `VENUE_TYPES`.
 */
export const VenueTypeSchema = z.enum(VENUE_TYPES);
/** The kind of venue the event uses. */
export type VenueType = z.infer<typeof VenueTypeSchema>;

/**
 * Human-readable labels for each venue type.
 */
export const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  indoor: 'Indoor',
  outdoor: 'Outdoor',
  mixed: 'Indoor and outdoor',
  unset: 'Not decided yet',
};
