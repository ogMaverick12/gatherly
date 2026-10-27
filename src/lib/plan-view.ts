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
 * One pass over a plan that produces every derived value the workspace
 * needs. The engines are pure, so this is safe to memoise on the plan
 * object: the result only changes when the plan changes.
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

// long-function: one pass over the inputs; splitting it would only pass the same state between more functions.
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

  const ideaContext: IdeaContext = {
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
    ideas: generateIdeas(ideaContext),
    snapshot,
  };
}
