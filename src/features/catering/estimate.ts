import { DIETARY_LABELS, type DietaryNeed, type Intake, type Plan } from '@/lib/plan';

/**
 * Catering engine.
 *
 * Produces quantities, not prices. A plate count is a fact about the guest
 * list; a price would be a guess about someone else's business, so the
 * engine stops at quantities and lets the budget tab do the money.
 */

/** Extra plates added for late arrivals, percent 0-100. */
export const BUFFER_PERCENT = 8;
/** How many guests one server can plate for. */
export const PLATES_PER_SERVER = 25;

export interface DietaryRequirement {
  readonly need: DietaryNeed;
  readonly label: string;
  readonly action: string;
  readonly confirmed: boolean;
}

export interface CateringEstimate {
  readonly guests: number;
  readonly mainPlates: number;
  readonly bufferPlates: number;
  readonly totalPlates: number;
  readonly starters: number;
  readonly desserts: number;
  readonly drinks: number;
  readonly servers: number;
  readonly leadStaff: number;
  readonly serviceHours: number;
  readonly dietary: readonly DietaryRequirement[];
  readonly notes: readonly string[];
}

const SERVICE_HOURS: Record<Plan['intake']['eventType'], number> = {
  wedding: 10,
  birthday: 5,
  community: 5,
};

function drinksPerGuest(serviceHours: number): number {
  if (serviceHours <= 5) return 1.2;
  if (serviceHours <= 8) return 1.6;
  return 2;
}

/** One requirement per recorded need, confirmed only when a caterer replied. */
function dietaryRequirements(
  intake: Intake,
  caterer: Plan['vendors'][number] | undefined,
): DietaryRequirement[] {
  const confirmed = Boolean(caterer) && (caterer?.notes.trim().length ?? 0) > 0;
  return intake.dietary.map((need) => ({
    need,
    label: DIETARY_LABELS[need],
    action: `Ask the caterer in writing to cover ${DIETARY_LABELS[need].toLowerCase()} meals and to label the plates.`,
    confirmed,
  }));
}

/** The lines that explain where the estimate can still move. */
function cateringNotes(intake: Intake, bufferPlates: number): string[] {
  const notes = [
    `${bufferPlates} extra plates (${BUFFER_PERCENT}%) cover the guests who always arrive late.`,
    'A plated meal needs one server for every 25 guests, plus two for the room.',
  ];
  if (intake.guestCountIsEstimate) {
    notes.push(
      'The guest count is still an estimate. Caterers usually need a final number three days before the event.',
    );
  }
  if (intake.venueType === 'outdoor') {
    notes.push('Outdoors, add a plan for shade, water and where the food is kept cool.');
  }
  if (intake.dietary.length === 0) {
    notes.push('No dietary needs were recorded. Ask anyway - people often forget to say.');
  }
  return notes;
}

/**
 * Works out the plate, drink and staffing quantities for a plan.
 * @param plan the plan whose guest count, event type, venue and dietary needs are read
 * @returns whole-number quantities (plates, drinks, servers) and the notes that explain them
 */
export function computeCatering(plan: Plan): CateringEstimate {
  const { intake } = plan;
  const guests = intake.guests;
  const bufferPlates = Math.ceil((guests * BUFFER_PERCENT) / 100);
  const serviceHours = SERVICE_HOURS[intake.eventType];
  const caterer = plan.vendors.find((vendor) => vendor.category === 'caterer');

  return {
    guests,
    mainPlates: guests,
    bufferPlates,
    totalPlates: guests + bufferPlates,
    starters: Math.ceil(guests * 0.9),
    desserts: Math.ceil(guests * 0.9),
    drinks: Math.ceil(guests * drinksPerGuest(serviceHours)),
    servers: Math.ceil(guests / PLATES_PER_SERVER) + 2,
    leadStaff: 1,
    serviceHours,
    dietary: dietaryRequirements(intake, caterer),
    notes: cateringNotes(intake, bufferPlates),
  };
}
