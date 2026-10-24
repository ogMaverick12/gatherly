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

export function computeRisks(inputs: RiskInputs): Risk[] {
  const { plan, budget, coverage, timeline, catering } = inputs;
  const risks: Risk[] = [];

  if (budget.totalMinor === 0) {
    risks.push({
      id: 'no-budget',
      severity: 'high',
      area: 'budget',
      title: 'There is no budget in this plan',
      explanation:
        'Without a budget the plan cannot show allocations, scenarios or per-guest figures.',
      mitigation: 'Set a total budget - a rough number is enough to start.',
    });
  }

  for (const warning of budget.warnings) {
    if (warning.severity !== 'attention') continue;
    risks.push({
      id: `budget-${warning.id}`,
      severity: 'high',
      area: 'budget',
      title: warning.title,
      explanation: warning.detail,
      mitigation:
        'Open the Budget tab and check the visible math for this category before you commit money.',
    });
  }

  const venueBooked = plan.vendors.some(
    (vendor) => vendor.category === 'venue' && vendor.status === 'booked',
  );
  const daysToEvent = timeline.daysToEvent;
  if (!venueBooked && daysToEvent !== null && daysToEvent <= 60) {
    risks.push({
      id: 'venue-late',
      severity: 'high',
      area: 'vendors',
      title: 'No venue booked yet',
      explanation: `The event is ${Math.max(0, daysToEvent)} days away and no venue is marked as booked.`,
      mitigation: 'Contact a venue today, even if the date is not confirmed yet.',
    });
  } else if (!venueBooked && daysToEvent === null) {
    risks.push({
      id: 'venue-unknown-date',
      severity: 'medium',
      area: 'vendors',
      title: 'No date, so no venue can be held',
      explanation: 'The event date is not set, which makes it hard to hold a venue or a caterer.',
      mitigation: 'Even a tentative date unlocks a written hold.',
    });
  }

  if (coverage.overallPercent < 40 && daysToEvent !== null && daysToEvent <= 90) {
    risks.push({
      id: 'coverage-low-soon',
      severity: 'high',
      area: 'vendors',
      title: 'Most vendors are still open',
      explanation: `Only ${coverage.overallPercent}% of the planned vendor budget is booked, and the event is ${Math.max(0, daysToEvent)} days away.`,
      mitigation: 'Pick the two bookings that cannot be changed later and close them first.',
    });
  }

  const unconfirmed = catering.dietary.filter((need) => !need.confirmed);
  if (unconfirmed.length > 0) {
    risks.push({
      id: 'dietary-unconfirmed',
      severity: 'high',
      area: 'catering',
      title: 'Dietary needs are not confirmed with a caterer',
      explanation: `${unconfirmed.length} dietary need${unconfirmed.length === 1 ? ' is' : 's are'} recorded but not yet confirmed in writing: ${unconfirmed.map((need) => need.label).join(', ')}.`,
      mitigation: 'Send the list to the caterer and keep their written reply.',
    });
  }

  for (const need of plan.intake.access) {
    const hasTask = plan.tasks.some(
      (task) =>
        task.area === 'accessibility' &&
        task.title.toLowerCase().includes((need.split(' ')[0] ?? '').toLowerCase()),
    );
    if (!hasTask) {
      risks.push({
        id: `access-${need}`,
        severity: 'medium',
        area: 'guest-experience',
        title: 'An access need has no task behind it',
        explanation: `"${need}" is recorded, but nothing on the checklist is going to make it happen.`,
        mitigation: 'Add a task and ask the venue in writing, not on the day.',
      });
    }
  }

  if (plan.intake.venueType === 'outdoor') {
    const month = plan.intake.eventDate ? Number(plan.intake.eventDate.slice(5, 7)) : null;
    if (month !== null && WET_MONTHS.has(month)) {
      risks.push({
        id: 'outdoor-wet-season',
        severity: 'medium',
        area: 'timeline',
        title: 'Outdoor event in a month that is often wet',
        explanation: `The date falls in month ${month}. We do not know where you are, so this is a general seasonal caution rather than a forecast.`,
        mitigation:
          'Have a covered plan agreed in writing, with the decision date written down too.',
      });
    }
  }

  if (plan.intake.guestCountIsEstimate) {
    risks.push({
      id: 'guests-estimate',
      severity: 'low',
      area: 'planning',
      title: 'The guest count is still an estimate',
      explanation: 'Catering, seating and print all move when the number moves.',
      mitigation: 'Re-run the catering estimate once the list settles, and keep a 8% plate buffer.',
    });
  }

  const order: Record<RiskSeverity, number> = { high: 0, medium: 1, low: 2 };
  return risks.sort((a, b) => order[a.severity] - order[b.severity]);
}
