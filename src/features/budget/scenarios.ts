/**
 * Budget scenarios.
 *
 * Each scenario re-costs the same plan with one assumption changed, so the
 * user can compare the shape of the spend rather than a single total.
 */

import type { Plan, Priority } from '@/lib/plan';
import { computeBudget } from './allocate';
import type { BudgetAllocation, BudgetScenario, ScenarioKind } from './types';

interface ScenarioSpec {
  readonly id: string;
  readonly kind: ScenarioKind;
  readonly label: string;
  readonly description: string;
  readonly candidate: Plan;
  readonly notes?: readonly string[];
}

function scenarioPlan(plan: Plan, patch: Partial<Plan['intake']>): Plan {
  return { ...plan, intake: { ...plan.intake, ...patch } };
}

/** Cost one candidate plan and compare it with the baseline allocation. */
function buildScenario(base: BudgetAllocation, spec: ScenarioSpec): BudgetScenario {
  const allocation = computeBudget(spec.candidate);
  return {
    id: spec.id,
    kind: spec.kind,
    label: spec.label,
    description: spec.description,
    totalMinor: allocation.totalMinor,
    committedMinor: allocation.committedMinor,
    contingencyMinor: allocation.contingencyMinor,
    categories: allocation.categories,
    deltaVsBaseMinor: allocation.committedMinor - base.committedMinor,
    exceedsCeiling: allocation.committedMinor + allocation.contingencyMinor > base.totalMinor,
    notes: spec.notes ?? [],
  };
}

/** The two guest-count comparisons. */
function guestScenarios(plan: Plan, base: BudgetAllocation): BudgetScenario[] {
  const { intake } = plan;
  return [
    buildScenario(base, {
      id: 'guests-plus-25',
      kind: 'guests-up',
      label: '25% more guests',
      description: 'What the same budget looks like if 25% more people come.',
      candidate: scenarioPlan(plan, { guests: Math.round(intake.guests * 1.25) }),
      notes: ['Guest count is still an estimate until you confirm numbers.'],
    }),
    buildScenario(base, {
      id: 'guests-minus-25',
      kind: 'guests-down',
      label: '25% fewer guests',
      description: 'What the same budget looks like if a quarter of the list does not come.',
      candidate: scenarioPlan(plan, { guests: Math.max(1, Math.round(intake.guests * 0.75)) }),
    }),
  ];
}

/** The two budget-total comparisons. */
function budgetScenarios(plan: Plan, base: BudgetAllocation): BudgetScenario[] {
  const { intake } = plan;
  return [
    buildScenario(base, {
      id: 'budget-plus-10',
      kind: 'budget-up',
      label: '10% more budget',
      description: 'The same plan with 10% more money to spend.',
      candidate: scenarioPlan(plan, { budgetMinor: Math.round(intake.budgetMinor * 1.1) }),
    }),
    buildScenario(base, {
      id: 'budget-minus-10',
      kind: 'budget-down',
      label: '10% less budget',
      description: 'The same plan with 10% less money to spend.',
      candidate: scenarioPlan(plan, { budgetMinor: Math.round(intake.budgetMinor * 0.9) }),
    }),
  ];
}

/** The venue comparisons that apply to the current venue. */
function venueScenarios(plan: Plan, base: BudgetAllocation): BudgetScenario[] {
  const { intake } = plan;
  const scenarios: BudgetScenario[] = [];
  if (intake.venueType !== 'outdoor') {
    scenarios.push(
      buildScenario(base, {
        id: 'venue-outdoor',
        kind: 'venue-outdoor',
        label: 'Move outdoors',
        description: 'Outdoor venues trade some indoor services for weather cover and shade.',
        candidate: scenarioPlan(plan, { venueType: 'outdoor' }),
        notes: ['Outdoor plans need a wet-weather line item and a power check.'],
      }),
    );
  }
  if (intake.venueType !== 'indoor') {
    scenarios.push(
      buildScenario(base, {
        id: 'venue-indoor',
        kind: 'venue-indoor',
        label: 'Move indoors',
        description: 'Indoor venues trade some outdoor services for space and power.',
        candidate: scenarioPlan(plan, { venueType: 'indoor' }),
        notes: ['Indoor plans need seating, air flow and a noise plan.'],
      }),
    );
  }
  return scenarios;
}

/** The priority comparison when another priority still fits. */
function priorityScenarios(plan: Plan, base: BudgetAllocation): BudgetScenario[] {
  const { intake } = plan;
  const nextPriority: Priority = intake.priorities.length > 0 ? 'sustainability' : 'food';
  if (intake.priorities.includes(nextPriority) || intake.priorities.length >= 4) return [];
  return [
    buildScenario(base, {
      id: 'priority-sustainability',
      kind: 'priority-add',
      label: 'Add a sustainability priority',
      description: 'See how the plan reshapes when sustainability is prioritised.',
      candidate: scenarioPlan(plan, { priorities: [...intake.priorities, nextPriority] }),
    }),
  ];
}

/**
 * Re-costs the plan under guest, budget, venue and priority changes.
 * @param plan the stored plan, used as the baseline for every comparison
 * @returns between four and seven scenarios, each with amounts in integer minor units (paise)
 * @example
 * computeScenarios(plan).find((s) => s.kind === 'guests-up')?.deltaVsBaseMinor; // paise
 */
export function computeScenarios(plan: Plan): BudgetScenario[] {
  const base = computeBudget(plan);
  return [
    ...guestScenarios(plan, base),
    ...budgetScenarios(plan, base),
    ...venueScenarios(plan, base),
    ...priorityScenarios(plan, base),
  ];
}
