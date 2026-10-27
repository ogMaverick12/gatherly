import type { Plan, Priority } from '@/lib/plan';
import { computeBudget } from './allocate';
import type { BudgetScenario, ScenarioKind } from './types';

function scenarioPlan(plan: Plan, patch: Partial<Plan['intake']>): Plan {
  return { ...plan, intake: { ...plan.intake, ...patch } };
}

// long-function: one pass over the inputs; splitting it would only pass the same state between more functions.
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
