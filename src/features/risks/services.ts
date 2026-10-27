import type { Plan } from '@/lib/plan';
import type { BudgetAllocation } from '@/features/budget/services';
import type { VendorCoverage } from '@/features/vendors/services';
import type { TimelineSummary } from '@/features/timeline/services';
import type { CateringEstimate } from '@/features/catering/services';

/**
 * Risk engine.
 *
 * Every risk names the rule that produced it, so the user can disagree with
 * the rule rather than guess what the app is worried about. Nothing here
 * infers religion, community, region or identity.
 */

export type RiskSeverity = 'low' | 'medium' | 'high';
export type RiskArea =
  'budget' | 'timeline' | 'vendors' | 'catering' | 'guest-experience' | 'planning';

export interface Risk {
  readonly id: string;
  readonly severity: RiskSeverity;
  readonly area: RiskArea;
  readonly title: string;
  readonly explanation: string;
  readonly mitigation: string;
}

export interface RiskInputs {
  readonly plan: Plan;
  readonly budget: BudgetAllocation;
  readonly coverage: VendorCoverage;
  readonly timeline: TimelineSummary;
  readonly catering: CateringEstimate;
}

/** Months that are wet in most places. Month only - never a region. */
const WET_MONTHS = new Set([6, 7, 8, 9]);

/** A plan with no money at all cannot be planned, and says so first. */
function noBudgetRisk(inputs: RiskInputs): Risk | null {
  if (inputs.budget.totalMinor !== 0) return null;
  return {
    id: 'no-budget',
    severity: 'high',
    area: 'budget',
    title: 'There is no budget in this plan',
    explanation:
      'Without a budget the plan cannot show allocations, scenarios or per-guest figures.',
    mitigation: 'Set a total budget - a rough number is enough to start.',
  };
}

/** Every budget warning that needs attention becomes a risk of its own. */
function budgetWarningRisks(inputs: RiskInputs): Risk[] {
  return inputs.budget.warnings
    .filter((warning) => warning.severity === 'attention')
    .map((warning) => ({
      id: `budget-${warning.id}`,
      severity: 'high' as const,
      area: 'budget',
      title: warning.title,
      explanation: warning.detail,
      mitigation:
        'Open the Budget tab and check the visible math for this category before you commit money.',
    }));
}

/** Whether a venue is held, and whether the date is even set. */
function venueRisks(inputs: RiskInputs): Risk[] {
  const venueBooked = inputs.plan.vendors.some(
    (vendor) => vendor.category === 'venue' && vendor.status === 'booked',
  );
  if (venueBooked) return [];
  const daysToEvent = inputs.timeline.daysToEvent;
  if (daysToEvent === null) {
    return [
      {
        id: 'venue-unknown-date',
        severity: 'medium',
        area: 'vendors',
        title: 'No date, so no venue can be held',
        explanation: 'The event date is not set, which makes it hard to hold a venue or a caterer.',
        mitigation: 'Even a tentative date unlocks a written hold.',
      },
    ];
  }
  if (daysToEvent > 60) return [];
  return [
    {
      id: 'venue-late',
      severity: 'high',
      area: 'vendors',
      title: 'No venue booked yet',
      explanation: `The event is ${Math.max(0, daysToEvent)} days away and no venue is marked as booked.`,
      mitigation: 'Contact a venue today, even if the date is not confirmed yet.',
    },
  ];
}

/** Coverage is fine until the event gets close with most vendors still open. */
function coverageRisk(inputs: RiskInputs): Risk | null {
  const daysToEvent = inputs.timeline.daysToEvent;
  if (inputs.coverage.overallPercent >= 40 || daysToEvent === null || daysToEvent > 90) return null;
  return {
    id: 'coverage-low-soon',
    severity: 'high',
    area: 'vendors',
    title: 'Most vendors are still open',
    explanation: `Only ${inputs.coverage.overallPercent}% of the planned vendor budget is booked, and the event is ${Math.max(0, daysToEvent)} days away.`,
    mitigation: 'Pick the two bookings that cannot be changed later and close them first.',
  };
}

/** A dietary need nobody has confirmed with the caterer in writing. */
function dietaryRisk(inputs: RiskInputs): Risk | null {
  const unconfirmed = inputs.catering.dietary.filter((need) => !need.confirmed);
  if (unconfirmed.length === 0) return null;
  const labels = unconfirmed.map((need) => need.label).join(', ');
  return {
    id: 'dietary-unconfirmed',
    severity: 'high',
    area: 'catering',
    title: 'Dietary needs are not confirmed with a caterer',
    explanation: `${unconfirmed.length} dietary need${unconfirmed.length === 1 ? ' is' : 's are'} recorded but not yet confirmed in writing: ${labels}.`,
    mitigation: 'Send the list to the caterer and keep their written reply.',
  };
}

/** An access need the checklist never turns into work. */
function accessRisks(inputs: RiskInputs): Risk[] {
  return inputs.plan.intake.access.flatMap((need) => {
    const hasTask = inputs.plan.tasks.some(
      (task) =>
        task.area === 'accessibility' &&
        task.title.toLowerCase().includes((need.split(' ')[0] ?? '').toLowerCase()),
    );
    if (hasTask) return [];
    return [
      {
        id: `access-${need}`,
        severity: 'medium' as const,
        area: 'guest-experience' as const,
        title: 'An access need has no task behind it',
        explanation: `"${need}" is recorded, but nothing on the checklist is going to make it happen.`,
        mitigation: 'Add a task and ask the venue in writing, not on the day.',
      },
    ];
  });
}

/** A general seasonal caution, never a forecast and never a location. */
function weatherRisk(inputs: RiskInputs): Risk | null {
  if (inputs.plan.intake.venueType !== 'outdoor') return null;
  const eventDate = inputs.plan.intake.eventDate;
  const month = eventDate ? Number(eventDate.slice(5, 7)) : null;
  if (month === null || !WET_MONTHS.has(month)) return null;
  return {
    id: 'outdoor-wet-season',
    severity: 'medium',
    area: 'timeline',
    title: 'Outdoor event in a month that is often wet',
    explanation: `The date falls in month ${month}. We do not know where you are, so this is a general seasonal caution rather than a forecast.`,
    mitigation: 'Have a covered plan agreed in writing, with the decision date written down too.',
  };
}

/** An estimate is not a number to order food against. */
function estimateRisk(inputs: RiskInputs): Risk | null {
  if (!inputs.plan.intake.guestCountIsEstimate) return null;
  return {
    id: 'guests-estimate',
    severity: 'low',
    area: 'planning',
    title: 'The guest count is still an estimate',
    explanation: 'Catering, seating and print all move when the number moves.',
    mitigation: 'Re-run the catering estimate once the list settles, and keep a 8% plate buffer.',
  };
}

/** The risk register: every rule above, most serious first. */
export function computeRisks(inputs: RiskInputs): Risk[] {
  const risks = [
    noBudgetRisk(inputs),
    ...budgetWarningRisks(inputs),
    ...venueRisks(inputs),
    coverageRisk(inputs),
    dietaryRisk(inputs),
    ...accessRisks(inputs),
    weatherRisk(inputs),
    estimateRisk(inputs),
  ].filter((risk): risk is Risk => risk !== null);

  const order: Record<RiskSeverity, number> = { high: 0, medium: 1, low: 2 };
  return risks.sort((a, b) => order[a.severity] - order[b.severity]);
}
