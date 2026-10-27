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

/**
 * Spread the spendable budget across the categories, applying the priority
 * boost and the pack shifts before the money is divided.
 * long-function: the weight, priority, pack and remainder steps share one working copy of the rows, so they run in one pass.
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
  const guests = intake.guests;

  const baseWeights = BASE_WEIGHTS[intake.eventType];
  const priorityTargets = new Set<BudgetCategoryId>();
  for (const priority of intake.priorities) {
    for (const category of PRIORITY_CATEGORY_MAP[priority]) priorityTargets.add(category);
  }

  const packShifts: Record<string, number> = {};
  const shiftByCategory: Record<string, number> = {};
  for (const pack of intake.packs) {
    for (const [category, points] of Object.entries(PACKS[pack].budgetShift)) {
      const key = category as BudgetCategoryId;
      shiftByCategory[key] = (shiftByCategory[key] ?? 0) + (points ?? 0);
      packShifts[key] = (packShifts[key] ?? 0) + (points ?? 0);
    }
  }

  const effectiveWeights = BUDGET_CATEGORIES.map((category) => {
    const base = baseWeights[category];
    const boosted = priorityTargets.has(category) ? Math.round(base * PRIORITY_MULTIPLIER) : base;
    const shifted = Math.max(0, boosted + (shiftByCategory[category] ?? 0));
    return { category, base, boosted, shifted };
  });

  const weightTotal = effectiveWeights.reduce((sum, item) => sum + item.shifted, 0);
  const amounts = allocateByWeight(
    spendableMinor,
    effectiveWeights.map((item) => item.shifted),
  );

  const benchmarks = benchmarkSharesFor(intake.eventType, guests);

  const categories: CategoryAllocation[] = effectiveWeights.map((item, index) => {
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

  return { categories, packShifts, weightTotal };
}

/** The full allocation: the contingency, the category amounts and the warnings. */
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
