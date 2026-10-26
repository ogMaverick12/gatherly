import { z } from 'zod';

/**
 * The vocabularies a plan is described with: what kind of event it is, where it
 * is held, and what the household says it cares about. Data and schemas only -
 * nothing here imports from `src/features`, so feature services can depend on
 * it without creating a cycle.
 */

export const EVENT_TYPES = ['wedding', 'birthday', 'community'] as const;
export const EventTypeSchema = z.enum(EVENT_TYPES);
export type EventType = z.infer<typeof EventTypeSchema>;

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  wedding: 'Wedding',
  birthday: 'Birthday',
  community: 'Community gathering',
};

export const CITY_TIERS = ['tier1', 'tier2', 'tier3'] as const;
export const CityTierSchema = z.enum(CITY_TIERS);
export type CityTier = z.infer<typeof CityTierSchema>;

export const CITY_TIER_LABELS: Record<CityTier, string> = {
  tier1: 'Tier 1 city (major metro)',
  tier2: 'Tier 2 city (regional centre)',
  tier3: 'Tier 3 city (smaller town)',
};

export const LANGUAGES = ['en', 'hi', 'bn'] as const;
export const LanguageSchema = z.enum(LANGUAGES);
export type Language = z.infer<typeof LanguageSchema>;

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'English',
  hi: 'हिन्दी',
  bn: 'বাংলা',
};

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
export const PrioritySchema = z.enum(PRIORITIES);
export type Priority = z.infer<typeof PrioritySchema>;

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
export const DietaryNeedSchema = z.enum(DIETARY_NEEDS);
export type DietaryNeed = z.infer<typeof DietaryNeedSchema>;

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
export const AccessNeedSchema = z.enum(ACCESS_NEEDS);
export type AccessNeed = z.infer<typeof AccessNeedSchema>;

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

export const VENUE_TYPES = ['indoor', 'outdoor', 'mixed', 'unset'] as const;
export const VenueTypeSchema = z.enum(VENUE_TYPES);
export type VenueType = z.infer<typeof VenueTypeSchema>;

export const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  indoor: 'Indoor',
  outdoor: 'Outdoor',
  mixed: 'Indoor and outdoor',
  unset: 'Not decided yet',
};
