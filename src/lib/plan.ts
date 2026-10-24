import { z } from 'zod';
import { addDays, todayDateOnly } from './dates';

/**
 * The single source of truth for Gatherly's vocabulary.
 *
 * Everything in this module is data and schemas only: it has no imports from
 * `src/features`, so feature services can depend on it without creating a
 * cycle. The README traceability table points at this file.
 */

/* ------------------------------------------------------------------ *
 * Controlled vocabularies
 * ------------------------------------------------------------------ */

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

export const BUDGET_CATEGORIES = [
  'venue',
  'catering',
  'photography',
  'decor',
  'music',
  'attire',
  'transport',
  'stationery',
  'entertainment',
  'officiant',
  'accommodation',
  'gifts',
] as const;
export const BudgetCategorySchema = z.enum(BUDGET_CATEGORIES);
export type BudgetCategoryId = z.infer<typeof BudgetCategorySchema>;

export const BUDGET_CATEGORY_LABELS: Record<BudgetCategoryId, string> = {
  venue: 'Venue & rentals',
  catering: 'Food & drink',
  photography: 'Photography & film',
  decor: 'Decor, flowers & lighting',
  music: 'Music & sound',
  attire: 'Attire & styling',
  transport: 'Transport & logistics',
  stationery: 'Stationery & signage',
  entertainment: 'Entertainment & activities',
  officiant: 'Ceremony & officiant',
  accommodation: 'Guest accommodation',
  gifts: 'Gifts & favours',
};

export const VENDOR_CATEGORIES = [
  'venue',
  'caterer',
  'photographer',
  'decorator',
  'music',
  'attire',
  'transport',
  'stationery',
  'officiant',
  'accommodation',
  'gifts',
] as const;
export const VendorCategorySchema = z.enum(VENDOR_CATEGORIES);
export type VendorCategoryId = z.infer<typeof VendorCategorySchema>;

export const VENDOR_CATEGORY_LABELS: Record<VendorCategoryId, string> = {
  venue: 'Venue',
  caterer: 'Caterer',
  photographer: 'Photographer',
  decorator: 'Decor & flowers',
  music: 'Music / DJ',
  attire: 'Attire & styling',
  transport: 'Transport',
  stationery: 'Stationery & signage',
  officiant: 'Officiant / ceremony lead',
  accommodation: 'Guest accommodation',
  gifts: 'Gifts & favours',
};

export const VENDOR_STATUSES = ['to_contact', 'contacted', 'quoted', 'booked', 'declined'] as const;
export const VendorStatusSchema = z.enum(VENDOR_STATUSES);
export type VendorStatus = z.infer<typeof VendorStatusSchema>;

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  to_contact: 'To contact',
  contacted: 'Contacted',
  quoted: 'Quote received',
  booked: 'Booked',
  declined: 'Passed',
};

export const TASK_AREAS = [
  'budget',
  'timeline',
  'vendors',
  'catering',
  'guest-experience',
  'accessibility',
  'sustainability',
  'logistics',
  'general',
] as const;
export const TaskAreaSchema = z.enum(TASK_AREAS);
export type TaskArea = z.infer<typeof TaskAreaSchema>;

/* ------------------------------------------------------------------ *
 * Currency
 *
 * Money is always stored as an integer number of minor units and always
 * carries its currency. Gatherly never converts between currencies, so a
 * plan can never mix two.
 * ------------------------------------------------------------------ */

export const CURRENCIES = [
  'INR',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'NGN',
  'IDR',
  'BRL',
  'ZAR',
  'AUD',
  'CAD',
  'SGD',
  'KES',
  'PHP',
  'MXN',
  'NPR',
  'BDT',
  'PKR',
  'LKR',
  'JPY',
] as const;
export const CurrencySchema = z.enum(CURRENCIES);
export type Currency = z.infer<typeof CurrencySchema>;

export interface CurrencyMeta {
  readonly code: Currency;
  readonly minorUnits: 0 | 2;
  readonly symbol: string;
  readonly label: string;
}

export const CURRENCY_META: Record<Currency, CurrencyMeta> = {
  INR: { code: 'INR', minorUnits: 2, symbol: '₹', label: 'Indian rupee' },
  USD: { code: 'USD', minorUnits: 2, symbol: '$', label: 'US dollar' },
  EUR: { code: 'EUR', minorUnits: 2, symbol: '€', label: 'Euro' },
  GBP: { code: 'GBP', minorUnits: 2, symbol: '£', label: 'Pound sterling' },
  AED: { code: 'AED', minorUnits: 2, symbol: 'د.إ', label: 'UAE dirham' },
  NGN: { code: 'NGN', minorUnits: 2, symbol: '₦', label: 'Nigerian naira' },
  IDR: { code: 'IDR', minorUnits: 2, symbol: 'Rp', label: 'Indonesian rupiah' },
  BRL: { code: 'BRL', minorUnits: 2, symbol: 'R$', label: 'Brazilian real' },
  ZAR: { code: 'ZAR', minorUnits: 2, symbol: 'R', label: 'South African rand' },
  AUD: { code: 'AUD', minorUnits: 2, symbol: 'A$', label: 'Australian dollar' },
  CAD: { code: 'CAD', minorUnits: 2, symbol: 'C$', label: 'Canadian dollar' },
  SGD: { code: 'SGD', minorUnits: 2, symbol: 'S$', label: 'Singapore dollar' },
  KES: { code: 'KES', minorUnits: 2, symbol: 'KSh', label: 'Kenyan shilling' },
  PHP: { code: 'PHP', minorUnits: 2, symbol: '₱', label: 'Philippine peso' },
  MXN: { code: 'MXN', minorUnits: 2, symbol: 'MX$', label: 'Mexican peso' },
  NPR: { code: 'NPR', minorUnits: 2, symbol: '₨', label: 'Nepalese rupee' },
  BDT: { code: 'BDT', minorUnits: 2, symbol: '৳', label: 'Bangladeshi taka' },
  PKR: { code: 'PKR', minorUnits: 2, symbol: '₨', label: 'Pakistani rupee' },
  LKR: { code: 'LKR', minorUnits: 2, symbol: 'Rs', label: 'Sri Lankan rupee' },
  JPY: { code: 'JPY', minorUnits: 0, symbol: '¥', label: 'Japanese yen' },
};

/* ------------------------------------------------------------------ *
 * Optional packs
 *
 * Packs are starting points a user explicitly opts into. They are never
 * inferred from names, cuisine, language or geography.
 * ------------------------------------------------------------------ */

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
export const PackIdSchema = z.enum(PACK_IDS);
export type PackId = z.infer<typeof PackIdSchema>;

export interface PackDefinition {
  readonly id: PackId;
  readonly name: string;
  readonly blurb: string;
  /** Extra checklist items the pack contributes to a plan. */
  readonly addsTasks: readonly string[];
  /** Percentage points moved to a category when the pack is selected. */
  readonly budgetShift: Readonly<Partial<Record<BudgetCategoryId, number>>>;
}

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

export const PACK_DISCLAIMER =
  'Packs are optional starting points. Confirm the details with family, elders, officiants or local organisers before you rely on them.';

/* ------------------------------------------------------------------ *
 * Schemas
 * ------------------------------------------------------------------ */

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DateOnlySchema = z
  .string()
  .regex(DATE_ONLY_PATTERN, 'Expected a calendar date as YYYY-MM-DD');

export const IsoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Expected an ISO-8601 timestamp');

export const PriorityListSchema = z.array(PrioritySchema).max(4);

export const IntakeSchema = z
  .object({
    eventType: EventTypeSchema,
    eventDate: DateOnlySchema.nullable(),
    guests: z.number().int().min(1).max(5000),
    cityTier: CityTierSchema,
    currency: CurrencySchema,
    budgetMinor: z.number().int().min(0).max(100_000_000_000),
    priorities: PriorityListSchema,
    cultureNote: z.string().max(300),
    dietary: z.array(DietaryNeedSchema).max(12),
    access: z.array(AccessNeedSchema).max(12),
    language: LanguageSchema,
    packs: z.array(PackIdSchema).max(6),
    venueType: VenueTypeSchema,
    guestCountIsEstimate: z.boolean(),
    notes: z.string().max(2000),
  })
  .strict();

export type Intake = z.infer<typeof IntakeSchema>;

export const PlanTaskSchema = z
  .object({
    id: z.string().min(1).max(80),
    title: z.string().min(1).max(160),
    done: z.boolean(),
    area: TaskAreaSchema,
  })
  .strict();

export type PlanTask = z.infer<typeof PlanTaskSchema>;

export const VendorSchema = z
  .object({
    id: z.string().min(1).max(80),
    category: VendorCategorySchema,
    name: z.string().max(120),
    status: VendorStatusSchema,
    quotedMinor: z.number().int().min(0).nullable(),
    depositMinor: z.number().int().min(0).nullable(),
    dueDate: DateOnlySchema.nullable(),
    phone: z.string().max(32),
    notes: z.string().max(600),
  })
  .strict();

export type Vendor = z.infer<typeof VendorSchema>;

export const MilestoneSchema = z
  .object({
    id: z.string().min(1).max(80),
    title: z.string().min(1).max(160),
    date: DateOnlySchema.nullable(),
    offsetDays: z.number().int().min(-400).max(400),
    done: z.boolean(),
    owner: z.string().max(80),
    whyItMatters: z.string().max(300),
  })
  .strict();

export type Milestone = z.infer<typeof MilestoneSchema>;

export const IdeaSchema = z
  .object({
    id: z.string().min(1).max(80),
    title: z.string().min(1).max(160),
    body: z.string().min(1).max(1200),
    rationale: z.string().max(600),
    costImpactMinor: z.number().int().nullable(),
    tags: z.array(z.string().max(40)).max(8),
    source: z.enum(['basic', 'provider']),
  })
  .strict();

export type Idea = z.infer<typeof IdeaSchema>;

export const ChatMessageSchema = z
  .object({
    id: z.string().min(1).max(80),
    role: z.enum(['user', 'assistant']),
    content: z.string().max(4000),
    mode: z.enum(['basic', 'provider']).nullable(),
    createdAt: IsoDateTimeSchema,
  })
  .strict();

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const PlanSettingsSchema = z
  .object({
    theme: z.enum(['light', 'dark', 'system']),
    textSize: z.enum(['standard', 'large', 'xlarge']),
    calmMode: z.boolean(),
    reducedMotion: z.boolean(),
  })
  .strict();

export type PlanSettings = z.infer<typeof PlanSettingsSchema>;

export const PLAN_VERSION = 1 as const;

export const PlanSchema = z
  .object({
    version: z.literal(PLAN_VERSION),
    id: z.string().min(1).max(80),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
    intake: IntakeSchema,
    tasks: z.array(PlanTaskSchema).max(400),
    vendors: z.array(VendorSchema).max(200),
    milestones: z.array(MilestoneSchema).max(200),
    ideas: z.array(IdeaSchema).max(60),
    chat: z.array(ChatMessageSchema).max(200),
    settings: PlanSettingsSchema,
  })
  .strict();

export type Plan = z.infer<typeof PlanSchema>;

/* ------------------------------------------------------------------ *
 * Sample plans
 *
 * Three one-click starting points, one per event family, each in a
 * different currency so the "no FX" model is visible from the start.
 * ------------------------------------------------------------------ */

export interface SampleTask {
  readonly title: string;
  readonly area: TaskArea;
}

export interface SampleVendor {
  readonly category: VendorCategoryId;
  readonly name: string;
  readonly status: VendorStatus;
  readonly notes: string;
}

export interface SamplePlanTemplate {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly daysFromNow: number;
  readonly intake: Intake;
  readonly tasks: readonly SampleTask[];
  readonly vendors: readonly SampleVendor[];
}

const WEDDING_INTAKE: Intake = {
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

const BIRTHDAY_INTAKE: Intake = {
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

const COMMUNITY_INTAKE: Intake = {
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

export const SAMPLE_PLAN_TEMPLATES: readonly SamplePlanTemplate[] = [
  {
    id: 'wedding',
    name: 'A 180-guest wedding',
    tagline: 'Daytime ceremony, evening reception, everything costed.',
    description:
      'A mid-size wedding in a tier 2 city, priced in Indian rupees, with food and photography as the priorities.',
    daysFromNow: 128,
    intake: WEDDING_INTAKE,
    tasks: [
      { title: 'Confirm the ceremony and reception venues', area: 'vendors' },
      { title: 'Shortlist three caterers and ask for a tasting', area: 'catering' },
      { title: 'Book a photographer for both parts of the day', area: 'vendors' },
      { title: 'Collect final guest numbers and dietary notes', area: 'guest-experience' },
      { title: 'Agree the rain plan with both venues', area: 'logistics' },
      { title: 'Write the timeline for family and suppliers', area: 'timeline' },
    ],
    vendors: [
      { category: 'venue', name: 'Garden hall', status: 'booked', notes: 'Holds 220 seated.' },
      {
        category: 'caterer',
        name: 'Sharma Caterers',
        status: 'quoted',
        notes: 'Two menus quoted.',
      },
      {
        category: 'photographer',
        name: 'Studio Aangan',
        status: 'contacted',
        notes: 'Awaiting the full-day quote.',
      },
      { category: 'decorator', name: '', status: 'to_contact', notes: '' },
      { category: 'music', name: '', status: 'to_contact', notes: '' },
      { category: 'transport', name: '', status: 'to_contact', notes: '' },
    ],
  },
  {
    id: 'birthday',
    name: 'A 60-guest garden birthday',
    tagline: 'An afternoon party that moves indoors at sunset.',
    description:
      'A tier 1 city birthday in US dollars, with photography, food and decor as the priorities and a nut-free requirement.',
    daysFromNow: 46,
    intake: BIRTHDAY_INTAKE,
    tasks: [
      { title: 'Confirm the garden venue and the indoor wet-weather plan', area: 'vendors' },
      { title: 'Order the cake and confirm the nut-free note', area: 'catering' },
      { title: 'Book the photographer for three hours', area: 'vendors' },
      { title: 'Confirm the step-free route from the car park', area: 'accessibility' },
      { title: 'Send invitations with the date, time and dress note', area: 'guest-experience' },
    ],
    vendors: [
      {
        category: 'venue',
        name: 'Botanical garden room',
        status: 'booked',
        notes: 'Wet-weather room held until Friday.',
      },
      {
        category: 'caterer',
        name: 'Harvest Table',
        status: 'quoted',
        notes: 'Quote includes service staff.',
      },
      {
        category: 'photographer',
        name: 'Halo Studio',
        status: 'booked',
        notes: 'Three hours, second shooter optional.',
      },
      { category: 'decorator', name: '', status: 'contacted', notes: '' },
      { category: 'music', name: '', status: 'to_contact', notes: '' },
    ],
  },
  {
    id: 'community',
    name: 'A 240-guest community feast',
    tagline: 'Shared tables, a shared kitchen, a neighbourhood-scale budget.',
    description:
      'A community gathering in pounds, with accessibility and logistics as the priorities and a shared-meal pack already selected.',
    daysFromNow: 74,
    intake: COMMUNITY_INTAKE,
    tasks: [
      { title: 'Confirm the hall and the step-free entrance', area: 'vendors' },
      { title: 'Agree the shared-kitchen schedule', area: 'catering' },
      { title: 'Set up the hearing loop and check it works', area: 'accessibility' },
      { title: 'Publish the dish contribution list', area: 'guest-experience' },
      { title: 'Plan the waste and recycling points', area: 'sustainability' },
      { title: 'Recruit six volunteers for the serving rota', area: 'logistics' },
    ],
    vendors: [
      {
        category: 'venue',
        name: 'Borough hall',
        status: 'booked',
        notes: 'Hall and kitchen both confirmed.',
      },
      {
        category: 'caterer',
        name: 'Shared kitchen team',
        status: 'contacted',
        notes: 'Confirming kitchen hire.',
      },
      { category: 'photographer', name: '', status: 'to_contact', notes: '' },
      {
        category: 'decorator',
        name: 'Volunteer team',
        status: 'to_contact',
        notes: 'Decor is community-made.',
      },
      { category: 'transport', name: '', status: 'to_contact', notes: '' },
      { category: 'officiant', name: '', status: 'to_contact', notes: 'A host is still needed.' },
    ],
  },
] as const;

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

export const DEFAULT_SETTINGS: PlanSettings = {
  theme: 'system',
  textSize: 'standard',
  calmMode: false,
  reducedMotion: false,
};

export function createPlan(
  intake: Intake,
  now: Date,
  id = `plan_${now.getTime().toString(36)}`,
): Plan {
  const timestamp = now.toISOString();
  return {
    version: PLAN_VERSION,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
    intake: { ...intake },
    tasks: [],
    vendors: [],
    milestones: [],
    ideas: [],
    chat: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

/**
 * Build a complete, editable plan from a sample template.
 * The sample is a starting point the user then changes - it is not a
 * read-only fixture.
 */
export function createSamplePlan(template: SamplePlanTemplate, now: Date): Plan {
  const plan = createPlan(
    {
      ...template.intake,
      eventDate: addDays(todayDateOnly(now), template.daysFromNow),
    },
    now,
    `sample_${template.id}_${now.getTime().toString(36)}`,
  );

  return {
    ...plan,
    tasks: template.tasks.map((task, index) => ({
      id: `task_${index + 1}_${slug(task.title)}`,
      title: task.title,
      done: false,
      area: task.area,
    })),
    vendors: template.vendors.map((vendor, index) => ({
      id: `vendor_${index + 1}_${vendor.category}`,
      category: vendor.category,
      name: vendor.name,
      status: vendor.status,
      quotedMinor: null,
      depositMinor: null,
      dueDate: null,
      phone: '',
      notes: vendor.notes,
    })),
  };
}

/** Parse untrusted JSON (localStorage, share links) into a plan. */
export function parsePlan(input: unknown): z.SafeParseReturnType<unknown, Plan> {
  return PlanSchema.safeParse(input);
}
