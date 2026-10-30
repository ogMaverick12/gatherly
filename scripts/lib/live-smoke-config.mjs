/** Repository root, resolved from this nested module. */
export const ROOT = new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

/** The local port the smoke test starts the production server on. */
export const PORT = Number(process.env.PORT ?? 3211);

/** The base URL every route probe calls. */
export const BASE = `http://127.0.0.1:${PORT}`;

/** The providers the smoke test can exercise. */
export const PROVIDERS = [
  { id: 'gemini', keyName: 'GEMINI_API_KEY', modelName: 'GATHERLY_GEMINI_MODEL' },
  { id: 'openrouter', keyName: 'OPENROUTER_API_KEY', modelName: 'GATHERLY_OPENROUTER_MODEL' },
];

/** Mirrors src/lib/ai/config.ts, so a missing env still prints the id that failed. */
export const DEFAULT_MODELS = {
  gemini: 'gemini-3.6-flash',
  openrouter: 'google/gemini-3.8-flash',
};

/** The shape of the parse answer, mirrored from src/lib/api-schema.ts. */
export const PARSED_FIELD_TYPES = {
  eventType: ['string', 'null'],
  eventDate: ['string', 'null'],
  guests: ['number', 'null'],
  cityTier: ['string', 'null'],
  currency: ['string', 'null'],
  budgetMinor: ['number', 'null'],
  priorities: ['array'],
  dietary: ['array'],
  access: ['array'],
  notes: ['string'],
};

/** The sample plan summary the routes expect. */
export const PLAN_SUMMARY =
  'A 120-guest wedding in a tier 2 city on 2026-12-05 with an indoor venue.';

/** A complete snapshot for the chat route. */
export const SNAPSHOT = {
  eventType: 'wedding',
  eventDate: '2026-12-05',
  guests: 120,
  cityTier: 'tier2',
  currency: 'INR',
  budgetMinor: 10_000_000,
  contingencyMinor: 800_000,
  perGuestMinor: 83_333,
  categories: [{ label: 'Catering', amountMinor: 2_700_000, sharePercent: 30 }],
  healthScore: 62,
  healthBand: 'attention',
  nextMilestone: 'Shortlist venues',
  nextMilestoneDate: '2026-09-06',
  overdueCount: 0,
  milestonesDone: 3,
  milestonesTotal: 12,
  vendorCoveragePercent: 25,
  outstandingVendors: ['Sharma Caterers'],
  plates: 360,
  drinks: 480,
  dietary: ['vegetarian'],
  tasksDone: 2,
  tasksTotal: 6,
  topRisks: ['The venue is not booked yet.'],
};

/** The context the ideas route expects. */
export const IDEAS_CONTEXT = {
  guests: 120,
  eventType: 'wedding',
  cityTier: 'tier2',
  currency: 'INR',
  budgetMinor: 10_000_000,
  perGuestMinor: 83_333,
  priorities: ['food'],
  dietary: ['vegetarian'],
  month: 12,
};
