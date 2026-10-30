/**
 * A single derived view of a plan: budget, timeline, health, risks and ideas.
 * The engines are pure, so the result can be memoised on the plan and date.
 */
import type { BudgetCategoryId, Plan } from './plan';
import { todayDateOnly, type DateOnly } from './dates';
import { computeBudget, computeScenarios, type BudgetScenario } from '@/features/budget/services';
import {
  buildMilestoneLadder,
  buildRunOfShow,
  mergeMilestoneState,
  summariseTimeline,
  type RunOfShowStep,
  type TimelineMilestone,
  type TimelineSummary,
} from '@/features/timeline/services';
import { computeVendorCoverage, type VendorCoverage } from '@/features/vendors/services';
import { computeCatering, type CateringEstimate } from '@/features/catering/services';
import { computeHealth, type HealthReport } from '@/features/health/services';
import { computeRisks, type Risk } from '@/features/risks/services';
import { generateIdeas, type IdeaContext } from '@/features/ideas/services';
import { buildSnapshot, type PlanSnapshot } from '@/features/assistant/services';

/**
 * Every derived value the workspace needs for one plan.
 * The result only changes when the plan or the reference date changes.
 */
export interface PlanView {
  readonly plan: Plan;
  readonly budget: ReturnType<typeof computeBudget>;
  readonly scenarios: readonly BudgetScenario[];
  readonly allocationByCategory: Readonly<Record<BudgetCategoryId, number>>;
  readonly coverage: VendorCoverage;
  readonly milestones: readonly TimelineMilestone[];
  readonly timeline: TimelineSummary;
  readonly runOfShow: readonly RunOfShowStep[];
  readonly catering: CateringEstimate;
  readonly health: HealthReport;
  readonly risks: readonly Risk[];
  readonly ideas: ReturnType<typeof generateIdeas>;
  readonly snapshot: PlanSnapshot;
}

/** Build the idea generator's context from the plan's intake. */
function buildIdeaContext(plan: Plan): IdeaContext {
  return {
    guests: plan.intake.guests,
    eventType: plan.intake.eventType,
    cityTier: plan.intake.cityTier,
    priorities: plan.intake.priorities,
    dietary: plan.intake.dietary,
    month: plan.intake.eventDate ? Number(plan.intake.eventDate.slice(5, 7)) : null,
    currency: plan.intake.currency,
    budgetMinor: plan.intake.budgetMinor,
    perGuestMinor:
      plan.intake.guests > 0 ? Math.round(plan.intake.budgetMinor / plan.intake.guests) : 0,
  };
}

/**
 * Compute every derived value for a plan in one pass.
 *
 * @param plan the plan to read
 * @param today the calendar date used for overdue and countdown checks (ISO date YYYY-MM-DD)
 * @returns the budget, timeline, health, risks, ideas and snapshot for the plan
 */
export function computePlanView(plan: Plan, today: DateOnly = todayDateOnly(new Date())): PlanView {
  const budget = computeBudget(plan);
  const allocationByCategory = Object.fromEntries(
    budget.categories.map((category) => [category.id, category.amountMinor]),
  ) as Record<BudgetCategoryId, number>;
  const coverage = computeVendorCoverage(plan, allocationByCategory);
  const milestones = mergeMilestoneState(plan.milestones, buildMilestoneLadder(plan, today));
  const timeline = summariseTimeline(milestones, today);
  const catering = computeCatering(plan);
  const health = computeHealth({ plan, budget, coverage, timeline });
  const risks = computeRisks({ plan, budget, coverage, timeline, catering });
  const snapshot = buildSnapshot(plan, budget, coverage, timeline, health, catering, risks);
  return {
    plan,
    budget,
    scenarios: computeScenarios(plan),
    allocationByCategory,
    coverage,
    milestones,
    timeline,
    runOfShow: buildRunOfShow(plan),
    catering,
    health,
    risks,
    ideas: generateIdeas(buildIdeaContext(plan)),
    snapshot,
  };
}
