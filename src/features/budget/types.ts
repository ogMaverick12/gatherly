/**
 * Budget result types.
 *
 * Every amount here is an integer in minor units (paise); formatting happens
 * only in the money helper.
 */

import type { BudgetCategoryId } from '@/lib/plan';

/** The numbers the budget UI renders, one row per category. */
export interface CategoryAllocation {
  readonly id: BudgetCategoryId;
  readonly label: string;
  readonly baseWeight: number;
  readonly effectiveWeight: number;
  readonly priorityBoost: boolean;
  readonly packShift: number;
  readonly sharePercent: number;
  readonly amountMinor: number;
  readonly perGuestMinor: number | null;
  readonly benchmarkSharePercent: number;
  readonly varianceFromBenchmark: number;
}

type WarningSeverity = 'info' | 'attention';

/** One warning about a budget allocation. */
export interface BudgetWarning {
  readonly id: string;
  readonly severity: WarningSeverity;
  readonly title: string;
  readonly detail: string;
  readonly category?: BudgetCategoryId;
}

/** The computed allocation for every budget category. */
export interface BudgetAllocation {
  readonly totalMinor: number;
  readonly contingencyMinor: number;
  readonly committedMinor: number;
  readonly categories: readonly CategoryAllocation[];
  readonly warnings: readonly BudgetWarning[];
  readonly math: {
    readonly contingencyPercent: number;
    readonly priorityMultiplier: number;
    readonly packShifts: Readonly<Record<string, number>>;
    readonly weightTotal: number;
  };
}

/** The kind of what-if scenario. */
export type ScenarioKind =
  | 'guests-up'
  | 'guests-down'
  | 'budget-up'
  | 'budget-down'
  | 'venue-outdoor'
  | 'venue-indoor'
  | 'priority-add';

/** One named budget scenario with its computed allocation. */
export interface BudgetScenario {
  readonly id: string;
  readonly kind: ScenarioKind;
  readonly label: string;
  readonly description: string;
  readonly totalMinor: number;
  readonly committedMinor: number;
  readonly contingencyMinor: number;
  readonly categories: readonly CategoryAllocation[];
  readonly deltaVsBaseMinor: number;
  readonly exceedsCeiling: boolean;
  readonly notes: readonly string[];
}
