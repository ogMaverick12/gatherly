import {
  BUDGET_CATEGORIES,
  BUDGET_CATEGORY_LABELS,
  PACKS,
  type BudgetCategoryId,
  type EventType,
  type Plan,
  type Priority,
} from '@/lib/plan';
import { allocateByWeight, formatMinorPlain, sharePercent, sumMinor } from '@/lib/money';

/**
 * Budget engine.
 *
 * Pure and deterministic: given a plan it returns the same allocation every
 * time. The math is shown to the user rather than hidden - the UI renders
 * base weight, priority boost, share and amount for every category.
 *
 * Gatherly deliberately does not publish "market prices". A price table per
 * currency and city tier would be a fabricated quote, and converting between
 * currencies would need a rate source we do not have. Instead the engine
 * works in *shares* of the user's own budget and compares them with published
 * benchmark shares.
 */

/** Share of the budget each category takes before priorities and packs. */
export const BASE_WEIGHTS: Record<EventType, Record<BudgetCategoryId, number>> = {
  wedding: {
    venue: 26,
    catering: 27,
    photography: 11,
    decor: 10,
    music: 5,
    attire: 4,
    transport: 3,
    stationery: 2,
    entertainment: 2,
    officiant: 4,
    accommodation: 4,
    gifts: 2,
  },
  birthday: {
    venue: 22,
    catering: 27,
    photography: 9,
    decor: 13,
    music: 7,
    attire: 3,
    transport: 2,
    stationery: 2,
    entertainment: 8,
    officiant: 0,
    accommodation: 0,
    gifts: 7,
  },
  community: {
    venue: 12,
    catering: 35,
    photography: 4,
    decor: 8,
    music: 4,
    attire: 0,
    transport: 5,
    stationery: 4,
    entertainment: 20,
    officiant: 2,
    accommodation: 0,
    gifts: 6,
  },
};

/**
 * Typical share of a budget for this event type, used only for comparison.
 * These are planning heuristics, not prices, and are published in
 * `docs/ARCHITECTURE.md`.
 */
export const BENCHMARK_SHARES: Record<EventType, Record<BudgetCategoryId, number>> = {
  wedding: {
    venue: 26,
    catering: 25,
    photography: 11,
    decor: 10,
    music: 5,
    attire: 4,
    transport: 3,
    stationery: 2,
    entertainment: 3,
    officiant: 4,
    accommodation: 4,
    gifts: 3,
  },
  birthday: {
    venue: 21,
    catering: 24,
    photography: 9,
    decor: 14,
    music: 7,
    attire: 4,
    transport: 3,
    stationery: 2,
    entertainment: 9,
    officiant: 0,
    accommodation: 0,
    gifts: 7,
  },
  community: {
    venue: 11,
    catering: 33,
    photography: 4,
    decor: 7,
    music: 4,
    attire: 0,
    transport: 6,
    stationery: 4,
    entertainment: 21,
    officiant: 2,
    accommodation: 0,
    gifts: 8,
  },
};

/** Which categories a priority pulls money towards. */
export const PRIORITY_CATEGORY_MAP: Record<Priority, readonly BudgetCategoryId[]> = {
  photography: ['photography'],
  food: ['catering'],
  music: ['music'],
  decor: ['decor'],
  logistics: ['transport'],
  'guest-experience': ['catering', 'venue'],
  accessibility: ['venue', 'stationery'],
  sustainability: ['catering', 'stationery'],
  formality: ['attire', 'decor'],
  simplicity: ['entertainment', 'stationery'],
};

export const PRIORITY_MULTIPLIER = 1.15;
export const CONTINGENCY_PERCENT = 8;

/** Share thresholds that produce a warning. Published so they can be argued with. */
export const CATERING_HEAVY_PERCENT = 35;
export const VENUE_LIGHT_PERCENT = 20;

/** Categories that scale with the guest count rather than being a flat cost. */
const PER_GUEST_CATEGORIES: ReadonlySet<BudgetCategoryId> = new Set([
  'venue',
  'catering',
  'decor',
  'transport',
  'stationery',
  'accommodation',
  'gifts',
]);

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

function benchmarkSharesFor(
  eventType: EventType,
  guests: number,
): Record<BudgetCategoryId, number> {
  const base = { ...BENCHMARK_SHARES[eventType] };
  // Larger events spend relatively more on food and service, less on decor.
  if (guests >= 200) {
    base.catering += 4;
    base.venue -= 1;
    base.decor -= 2;
    base.stationery -= 1;
  } else if (guests < 50) {
    base.catering -= 3;
    base.decor += 2;
    base.photography += 1;
  }
  return base;
}

export function computeBudget(plan: Plan): BudgetAllocation {
  const { intake } = plan;
  const totalMinor = intake.budgetMinor;
  const guests = intake.guests;

  const contingencyMinor = Math.round((totalMinor * CONTINGENCY_PERCENT) / 100);
  const spendableMinor = Math.max(0, totalMinor - contingencyMinor);

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

  const warnings: BudgetWarning[] = [];

  if (totalMinor === 0) {
    warnings.push({
      id: 'no-budget',
      severity: 'attention',
      title: 'No budget set',
      detail: 'Add a budget to see allocations, scenarios and per-guest figures.',
    });
  }

  const catering = categories.find((category) => category.id === 'catering');
  if (catering && catering.sharePercent > CATERING_HEAVY_PERCENT) {
    warnings.push({
      id: 'catering-heavy',
      severity: 'info',
      title: 'Most of the budget sits with food',
      detail: `${catering.sharePercent}% of your spendable budget is food and drink. That is a lot of weight on one line - check the per-guest figure before committing.`,
      category: 'catering',
    });
  }

  const venue = categories.find((category) => category.id === 'venue');
  if (venue && (intake.venueType === 'indoor' || intake.venueType === 'mixed')) {
    if (venue.sharePercent < VENUE_LIGHT_PERCENT) {
      warnings.push({
        id: 'venue-light',
        severity: 'info',
        title: 'The venue line is small',
        detail: `The venue holds ${venue.sharePercent}% of the budget. For an indoor event that is worth checking - capacity, hire and any minimum spend all live in that number.`,
        category: 'venue',
      });
    }
  }

  for (const priority of intake.priorities) {
    const targets = PRIORITY_CATEGORY_MAP[priority];
    const hasWeight = targets.some((target) => (baseWeights[target] ?? 0) > 0);
    if (!hasWeight) {
      warnings.push({
        id: `priority-unmet-${priority}`,
        severity: 'info',
        title: 'A priority has no budget behind it',
        detail:
          'This event type does not usually spend on the category behind that priority, so the boost had nothing to move. Adjust the plan or drop the priority.',
      });
    }
  }

  const allocated = sumMinor(categories.map((category) => category.amountMinor));
  if (allocated !== spendableMinor) {
    warnings.push({
      id: 'unallocated',
      severity: 'attention',
      title: 'Allocation does not add up',
      detail:
        'The category amounts do not sum to the spendable budget. Please report this - it is a bug, not a planning problem.',
    });
  }

  const quotedMinor = plan.vendors.reduce((sum, vendor) => sum + (vendor.quotedMinor ?? 0), 0);
  if (totalMinor > 0 && quotedMinor > totalMinor) {
    warnings.push({
      id: 'quotes-over-budget',
      severity: 'attention',
      title: 'The quotes you have recorded are more than the plan',
      detail: `Recorded quotes come to ${formatMinorPlain(quotedMinor, intake.currency)} against a budget of ${formatMinorPlain(totalMinor, intake.currency)}. Something has to give: a smaller quote, a different vendor, or a bigger budget.`,
    });
  }

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

/* ------------------------------------------------------------------ *
 * What-if scenarios
 * ------------------------------------------------------------------ */

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

function scenarioPlan(plan: Plan, patch: Partial<Plan['intake']>): Plan {
  return { ...plan, intake: { ...plan.intake, ...patch } };
}

export function computeScenarios(plan: Plan): BudgetScenario[] {
  const base = computeBudget(plan);
  const { intake } = plan;
  const scenarios: BudgetScenario[] = [];

  const push = (
    id: string,
    kind: ScenarioKind,
    label: string,
    description: string,
    candidate: Plan,
    notes: string[] = [],
  ) => {
    const allocation = computeBudget(candidate);
    const deltaVsBase = allocation.committedMinor - base.committedMinor;
    scenarios.push({
      id,
      kind,
      label,
      description,
      totalMinor: allocation.totalMinor,
      committedMinor: allocation.committedMinor,
      contingencyMinor: allocation.contingencyMinor,
      categories: allocation.categories,
      deltaVsBaseMinor: deltaVsBase,
      exceedsCeiling: allocation.committedMinor + allocation.contingencyMinor > base.totalMinor,
      notes,
    });
  };

  push(
    'guests-plus-25',
    'guests-up',
    '25% more guests',
    'What the same budget looks like if 25% more people come.',
    scenarioPlan(plan, { guests: Math.round(intake.guests * 1.25) }),
    ['Guest count is still an estimate until you confirm numbers.'],
  );

  push(
    'guests-minus-25',
    'guests-down',
    '25% fewer guests',
    'What the same budget looks like if a quarter of the list does not come.',
    scenarioPlan(plan, { guests: Math.max(1, Math.round(intake.guests * 0.75)) }),
  );

  push(
    'budget-plus-10',
    'budget-up',
    '10% more budget',
    'The same plan with 10% more money to spend.',
    scenarioPlan(plan, {
      budgetMinor: Math.round(intake.budgetMinor * 1.1),
    }),
  );

  push(
    'budget-minus-10',
    'budget-down',
    '10% less budget',
    'The same plan with 10% less money to spend.',
    scenarioPlan(plan, {
      budgetMinor: Math.round(intake.budgetMinor * 0.9),
    }),
  );

  if (intake.venueType !== 'outdoor') {
    push(
      'venue-outdoor',
      'venue-outdoor',
      'Move outdoors',
      'Outdoor venues trade some indoor services for weather cover and shade.',
      scenarioPlan(plan, { venueType: 'outdoor' }),
      ['Outdoor plans need a wet-weather line item and a power check.'],
    );
  }

  if (intake.venueType !== 'indoor') {
    push(
      'venue-indoor',
      'venue-indoor',
      'Move indoors',
      'Indoor venues trade some outdoor services for space and power.',
      scenarioPlan(plan, { venueType: 'indoor' }),
      ['Indoor plans need seating, air flow and a noise plan.'],
    );
  }

  const nextPriority: Priority = intake.priorities.length > 0 ? 'sustainability' : 'food';
  if (!intake.priorities.includes(nextPriority) && intake.priorities.length < 4) {
    push(
      'priority-sustainability',
      'priority-add',
      'Add a sustainability priority',
      'See how the plan reshapes when sustainability is prioritised.',
      scenarioPlan(plan, { priorities: [...intake.priorities, nextPriority] }),
    );
  }

  return scenarios;
}
