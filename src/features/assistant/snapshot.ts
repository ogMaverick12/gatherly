import type { BudgetAllocation } from '@/features/budget/services';
import type { CateringEstimate } from '@/features/catering/services';
import type { HealthReport } from '@/features/health/services';
import type { Risk } from '@/features/risks/services';
import type { TimelineSummary } from '@/features/timeline/services';
import type { VendorCoverage } from '@/features/vendors/services';
import type { Plan } from '@/lib/plan';

/**
 * The snapshot: the one object an answer is written from.
 *
 * It holds the numbers the other engines computed for this plan, so the
 * assistant never re-derives them and can never disagree with the screen.
 */

export interface PlanSnapshot {
  readonly eventType: Plan['intake']['eventType'];
  readonly eventDate: string | null;
  readonly guests: number;
  readonly cityTier: Plan['intake']['cityTier'];
  readonly currency: Plan['intake']['currency'];
  readonly budgetMinor: number;
  readonly contingencyMinor: number;
  readonly perGuestMinor: number;
  readonly categories: readonly {
    readonly label: string;
    readonly amountMinor: number;
    readonly sharePercent: number;
  }[];
  readonly healthScore: number;
  readonly healthBand: HealthReport['band'];
  readonly nextMilestone: string | null;
  readonly nextMilestoneDate: string | null;
  readonly overdueCount: number;
  readonly milestonesDone: number;
  readonly milestonesTotal: number;
  readonly vendorCoveragePercent: number;
  readonly outstandingVendors: readonly string[];
  readonly plates: number;
  readonly drinks: number;
  readonly dietary: readonly string[];
  readonly tasksDone: number;
  readonly tasksTotal: number;
  readonly topRisks: readonly string[];
}

/**
 * Collects the numbers the other engines produced into one read-only object.
 * @param plan the stored plan, for intake, tasks and vendors
 * @param budget the allocation, in integer minor units (paise)
 * @param coverage the vendor coverage percentages
 * @param timeline the ladder summary with its counts and next step
 * @param health the plan health report
 * @param catering the plate and drink estimate
 * @param risks the risk register, most serious first
 * @returns the snapshot the assistant and overview read from
 */
// long-function: one pass over the inputs; splitting it would only pass the same state between more functions.
export function buildSnapshot(
  plan: Plan,
  budget: BudgetAllocation,
  coverage: VendorCoverage,
  timeline: TimelineSummary,
  health: HealthReport,
  catering: CateringEstimate,
  risks: readonly Risk[],
): PlanSnapshot {
  const outstanding = plan.vendors
    .filter((vendor) => vendor.status !== 'booked' && vendor.status !== 'declined')
    .map((vendor) => vendor.name || vendor.category);

  return {
    eventType: plan.intake.eventType,
    eventDate: plan.intake.eventDate,
    guests: plan.intake.guests,
    cityTier: plan.intake.cityTier,
    currency: plan.intake.currency,
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
    healthScore: health.score,
    healthBand: health.band,
    nextMilestone: timeline.nextUp?.title ?? null,
    nextMilestoneDate: timeline.nextUp?.date ?? null,
    overdueCount: timeline.overdue,
    milestonesDone: timeline.done,
    milestonesTotal: timeline.total,
    vendorCoveragePercent: coverage.overallPercent,
    outstandingVendors: outstanding.slice(0, 6),
    plates: catering.totalPlates,
    drinks: catering.drinks,
    dietary: catering.dietary.map((need) => need.label),
    tasksDone: plan.tasks.filter((task) => task.done).length,
    tasksTotal: plan.tasks.length,
    topRisks: risks.slice(0, 3).map((risk) => risk.title),
  };
}
