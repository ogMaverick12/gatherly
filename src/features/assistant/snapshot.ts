import type { BudgetAllocation } from '@/features/budget';
import type { CateringEstimate } from '@/features/catering';
import type { HealthReport } from '@/features/health';
import type { Risk } from '@/features/risks';
import type { TimelineSummary } from '@/features/timeline';
import type { VendorCoverage } from '@/features/vendors';
import type { Plan } from '@/lib/plan';
import type { PlanSnapshot } from '@/lib/plan-snapshot';

/** The intake fields copied straight from the plan. */
function planFields(
  plan: Plan,
): Pick<PlanSnapshot, 'eventType' | 'eventDate' | 'guests' | 'cityTier' | 'currency'> {
  return {
    eventType: plan.intake.eventType,
    eventDate: plan.intake.eventDate,
    guests: plan.intake.guests,
    cityTier: plan.intake.cityTier,
    currency: plan.intake.currency,
  };
}

/** The money fields and the non-zero category rows. */
function budgetFields(
  plan: Plan,
  budget: BudgetAllocation,
): Pick<PlanSnapshot, 'budgetMinor' | 'contingencyMinor' | 'perGuestMinor' | 'categories'> {
  return {
    budgetMinor: budget.totalMinor,
    contingencyMinor: budget.contingencyMinor,
    perGuestMinor: plan.intake.guests > 0 ? Math.round(budget.totalMinor / plan.intake.guests) : 0,
    categories: budget.categories
      .filter((category) => category.amountMinor > 0)
      .map((category) => ({
        label: category.label,
        amountMinor: category.amountMinor,
        sharePercent: category.sharePercent,
      })),
  };
}

/** The health score and band. */
function healthFields(health: HealthReport): Pick<PlanSnapshot, 'healthScore' | 'healthBand'> {
  return { healthScore: health.score, healthBand: health.band };
}

/** The next milestone and completion counts. */
function timelineFields(
  timeline: TimelineSummary,
): Pick<
  PlanSnapshot,
  'nextMilestone' | 'nextMilestoneDate' | 'overdueCount' | 'milestonesDone' | 'milestonesTotal'
> {
  return {
    nextMilestone: timeline.nextUp?.title ?? null,
    nextMilestoneDate: timeline.nextUp?.date ?? null,
    overdueCount: timeline.overdue,
    milestonesDone: timeline.done,
    milestonesTotal: timeline.total,
  };
}

/** The vendor coverage percentage and the first six outstanding names. */
function vendorFields(
  plan: Plan,
  coverage: VendorCoverage,
): Pick<PlanSnapshot, 'vendorCoveragePercent' | 'outstandingVendors'> {
  const outstanding = plan.vendors
    .filter((vendor) => vendor.status !== 'booked' && vendor.status !== 'declined')
    .map((vendor) => vendor.name || vendor.category);
  return {
    vendorCoveragePercent: coverage.overallPercent,
    outstandingVendors: outstanding.slice(0, 6),
  };
}

/** The plate, drink and dietary figures. */
function cateringFields(
  catering: CateringEstimate,
): Pick<PlanSnapshot, 'plates' | 'drinks' | 'dietary'> {
  return {
    plates: catering.totalPlates,
    drinks: catering.drinks,
    dietary: catering.dietary.map((need) => need.label),
  };
}

/** The task completion counts. */
function taskFields(plan: Plan): Pick<PlanSnapshot, 'tasksDone' | 'tasksTotal'> {
  return {
    tasksDone: plan.tasks.filter((task) => task.done).length,
    tasksTotal: plan.tasks.length,
  };
}

/** The first three risk titles. */
function riskFields(risks: readonly Risk[]): Pick<PlanSnapshot, 'topRisks'> {
  return { topRisks: risks.slice(0, 3).map((risk) => risk.title) };
}

/** The engine results one snapshot is built from. */
export interface SnapshotInputs {
  readonly plan: Plan;
  readonly budget: BudgetAllocation;
  readonly coverage: VendorCoverage;
  readonly timeline: TimelineSummary;
  readonly health: HealthReport;
  readonly catering: CateringEstimate;
  readonly risks: readonly Risk[];
}

/**
 * Collects the numbers the other engines produced into one read-only object.
 * @param inputs the plan and the results of the budget, vendor, timeline, health, catering and risk engines
 * @returns the snapshot the assistant and overview read from
 */
export function buildSnapshot(inputs: SnapshotInputs): PlanSnapshot {
  const { plan, budget, coverage, timeline, health, catering, risks } = inputs;
  return {
    ...planFields(plan),
    ...budgetFields(plan, budget),
    ...healthFields(health),
    ...timelineFields(timeline),
    ...vendorFields(plan, coverage),
    ...cateringFields(catering),
    ...taskFields(plan),
    ...riskFields(risks),
  };
}
