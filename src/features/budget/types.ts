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

export type WarningSeverity = 'info' | 'attention';

export interface BudgetWarning {
  readonly id: string;
  readonly severity: WarningSeverity;
  readonly title: string;
  readonly detail: string;
  readonly category?: BudgetCategoryId;
}

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

export type ScenarioKind =
  | 'guests-up'
  | 'guests-down'
  | 'budget-up'
  | 'budget-down'
  | 'venue-outdoor'
  | 'venue-indoor'
  | 'priority-add';

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
