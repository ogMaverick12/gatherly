/**
 * The budget allocator.
 *
 * It reserves the contingency, applies weights, priorities and pack shifts,
 * then divides the spendable money down to the last minor unit.
 */

import {
  BUDGET_CATEGORIES,
  BUDGET_CATEGORY_LABELS,
  PACKS,
  type BudgetCategoryId,
  type Plan,
} from '@/lib/plan';
import { allocateByWeight, sharePercent } from '@/lib/money';
import {
  BASE_WEIGHTS,
  CONTINGENCY_PERCENT,
  PER_GUEST_CATEGORIES,
  PRIORITY_CATEGORY_MAP,
  PRIORITY_MULTIPLIER,
  benchmarkSharesFor,
} from './weights';
import type { BudgetAllocation, CategoryAllocation } from './types';
import { budgetWarnings } from './warnings';

interface EffectiveWeight {
  readonly category: BudgetCategoryId;
  readonly base: number;
  readonly boosted: number;
  readonly shifted: number;
}

/** The categories the selected priorities want to boost. */
function priorityTargetsFor(priorities: Plan['intake']['priorities']): Set<BudgetCategoryId> {
  const targets = new Set<BudgetCategoryId>();
  for (const priority of priorities) {
    for (const category of PRIORITY_CATEGORY_MAP[priority]) targets.add(category);
  }
  return targets;
}

/** Combine every selected pack into per-category shifts. */
function packShiftMaps(packs: Plan['intake']['packs']) {
  const packShifts: Record<string, number> = {};
  const shiftByCategory: Record<string, number> = {};
  for (const pack of packs) {
    for (const [category, points] of Object.entries(PACKS[pack].budgetShift)) {
      const key = category as BudgetCategoryId;
      shiftByCategory[key] = (shiftByCategory[key] ?? 0) + (points ?? 0);
      packShifts[key] = (packShifts[key] ?? 0) + (points ?? 0);
    }
  }
  return { packShifts, shiftByCategory };
}

/** Apply priority boosts and pack shifts to every category's base weight. */
function effectiveWeightsFor(
  eventType: Plan['intake']['eventType'],
  priorityTargets: ReadonlySet<BudgetCategoryId>,
  shiftByCategory: Readonly<Record<string, number>>,
): EffectiveWeight[] {
  const baseWeights = BASE_WEIGHTS[eventType];
  return BUDGET_CATEGORIES.map((category) => {
    const base = baseWeights[category];
    const boosted = priorityTargets.has(category) ? Math.round(base * PRIORITY_MULTIPLIER) : base;
    const shifted = Math.max(0, boosted + (shiftByCategory[category] ?? 0));
    return { category, base, boosted, shifted };
  });
}

/** Turn the weighted shares into the display rows, including rounding variance. */
function buildCategoryRows(
  weights: readonly EffectiveWeight[],
  amounts: readonly number[],
  spendableMinor: number,
  guests: number,
  shiftByCategory: Readonly<Record<string, number>>,
  benchmarks: ReturnType<typeof benchmarkSharesFor>,
): CategoryAllocation[] {
  return weights.map((item, index) => {
    const amountMinor = amounts[index] ?? 0;
    const share = sharePercent(amountMinor, spendableMinor);
    const benchmarkSharePercent = benchmarks[item.category];
    return {
      id: item.category,
      label: BUDGET_CATEGORY_LABELS[item.category],
      baseWeight: item.base,
      effectiveWeight: item.shifted,
      priorityBoost: item.boosted !== item.base,
      packShift: shiftByCategory[item.category] ?? 0,
      sharePercent: share,
      amountMinor,
      perGuestMinor:
        PER_GUEST_CATEGORIES.has(item.category) && guests > 0
          ? Math.round(amountMinor / guests)
          : null,
      benchmarkSharePercent,
      varianceFromBenchmark: Math.round((share - benchmarkSharePercent) * 10) / 10,
    };
  });
}

/**
 * Spread the spendable budget across the categories, applying the priority
 * boost and the pack shifts before the money is divided.
 */
function allocateCategories(
  plan: Plan,
  spendableMinor: number,
): {
  categories: CategoryAllocation[];
  packShifts: Record<string, number>;
  weightTotal: number;
} {
  const { intake } = plan;
  const priorityTargets = priorityTargetsFor(intake.priorities);
  const { packShifts, shiftByCategory } = packShiftMaps(intake.packs);
  const weights = effectiveWeightsFor(intake.eventType, priorityTargets, shiftByCategory);
  const weightTotal = weights.reduce((sum, item) => sum + item.shifted, 0);
  const amounts = allocateByWeight(
    spendableMinor,
    weights.map((item) => item.shifted),
  );
  const benchmarks = benchmarkSharesFor(intake.eventType, intake.guests);
  const categories = buildCategoryRows(
    weights,
    amounts,
    spendableMinor,
    intake.guests,
    shiftByCategory,
    benchmarks,
  );
  return { categories, packShifts, weightTotal };
}

/**
 * The full allocation: the contingency, the category amounts and the warnings.
 * @param plan the plan whose intake drives the split
 * @returns amounts in integer minor units (paise), with the working kept for display
 * @example
 * computeBudget(plan).contingencyMinor; // 8% of plan.intake.budgetMinor
 */
export function computeBudget(plan: Plan): BudgetAllocation {
  const { intake } = plan;
  const totalMinor = intake.budgetMinor;

  const contingencyMinor = Math.round((totalMinor * CONTINGENCY_PERCENT) / 100);
  const spendableMinor = Math.max(0, totalMinor - contingencyMinor);

  const { categories, packShifts, weightTotal } = allocateCategories(plan, spendableMinor);
  const warnings = budgetWarnings(plan, categories, spendableMinor);

  return {
    totalMinor,
    contingencyMinor,
    committedMinor: spendableMinor,
    categories,
    warnings,
    math: {
      contingencyPercent: CONTINGENCY_PERCENT,
      priorityMultiplier: PRIORITY_MULTIPLIER,
      packShifts,
      weightTotal,
    },
  };
}
