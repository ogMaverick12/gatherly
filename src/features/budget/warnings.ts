/**
 * Budget warnings.
 *
 * Each warning names what was measured and what to do about it, using the
 * same allocation the tab shows so the numbers cannot disagree.
 */

import type { Plan } from '@/lib/plan';
import { formatMinorPlain, sumMinor } from '@/lib/money';
import {
  BASE_WEIGHTS,
  CATERING_HEAVY_PERCENT,
  PRIORITY_CATEGORY_MAP,
  VENUE_LIGHT_PERCENT,
} from './weights';
import type { BudgetWarning, CategoryAllocation } from './types';

/** Warn when no budget has been set at all. */
function noBudgetWarnings(totalMinor: number): BudgetWarning[] {
  if (totalMinor !== 0) return [];
  return [
    {
      id: 'no-budget',
      severity: 'attention',
      title: 'No budget set',
      detail: 'Add a budget to see allocations, scenarios and per-guest figures.',
    },
  ];
}

/** Warn when food and drink take too large a share. */
function cateringWarnings(categories: readonly CategoryAllocation[]): BudgetWarning[] {
  const catering = categories.find((category) => category.id === 'catering');
  if (!catering || catering.sharePercent <= CATERING_HEAVY_PERCENT) return [];
  return [
    {
      id: 'catering-heavy',
      severity: 'info',
      title: 'Most of the budget sits with food',
      detail: `${catering.sharePercent}% of your spendable budget is food and drink. That is a lot of weight on one line - check the per-guest figure before committing.`,
      category: 'catering',
    },
  ];
}

/** Warn when an indoor or mixed venue line looks unusually small. */
function venueWarnings(
  intake: Plan['intake'],
  categories: readonly CategoryAllocation[],
): BudgetWarning[] {
  const venue = categories.find((category) => category.id === 'venue');
  const indoor = intake.venueType === 'indoor' || intake.venueType === 'mixed';
  if (!venue || !indoor || venue.sharePercent >= VENUE_LIGHT_PERCENT) return [];
  return [
    {
      id: 'venue-light',
      severity: 'info',
      title: 'The venue line is small',
      detail: `The venue holds ${venue.sharePercent}% of the budget. For an indoor event that is worth checking - capacity, hire and any minimum spend all live in that number.`,
      category: 'venue',
    },
  ];
}

/** Warn for each priority the event type normally spends nothing on. */
function priorityWarnings(intake: Plan['intake']): BudgetWarning[] {
  const baseWeights = BASE_WEIGHTS[intake.eventType];
  return intake.priorities.flatMap((priority) => {
    const targets = PRIORITY_CATEGORY_MAP[priority];
    const hasWeight = targets.some((target) => (baseWeights[target] ?? 0) > 0);
    if (hasWeight) return [];
    return [
      {
        id: `priority-unmet-${priority}`,
        severity: 'info' as const,
        title: 'A priority has no budget behind it',
        detail:
          'This event type does not usually spend on the category behind that priority, so the boost had nothing to move. Adjust the plan or drop the priority.',
      },
    ];
  });
}

/** Warn when the category amounts do not add up to the spendable budget. */
function unallocatedWarnings(
  categories: readonly CategoryAllocation[],
  spendableMinor: number,
): BudgetWarning[] {
  const allocated = sumMinor(categories.map((category) => category.amountMinor));
  if (allocated === spendableMinor) return [];
  return [
    {
      id: 'unallocated',
      severity: 'attention',
      title: 'Allocation does not add up',
      detail:
        'The category amounts do not sum to the spendable budget. Please report this - it is a bug, not a planning problem.',
    },
  ];
}

/** Warn when recorded vendor quotes exceed the total budget. */
function quoteWarnings(plan: Plan, totalMinor: number): BudgetWarning[] {
  const quotedMinor = plan.vendors.reduce((sum, vendor) => sum + (vendor.quotedMinor ?? 0), 0);
  if (totalMinor <= 0 || quotedMinor <= totalMinor) return [];
  const currency = plan.intake.currency;
  return [
    {
      id: 'quotes-over-budget',
      severity: 'attention',
      title: 'The quotes you have recorded are more than the plan',
      detail: `Recorded quotes come to ${formatMinorPlain(quotedMinor, currency)} against a budget of ${formatMinorPlain(totalMinor, currency)}. Something has to give: a smaller quote, a different vendor, or a bigger budget.`,
    },
  ];
}

/**
 * The warnings a budget raises: each one names what was measured and what the
 * user can do about it, built from the allocation so the numbers in them are
 * the numbers on screen.
 * @param plan the stored plan with intake and vendors
 * @param categories the computed allocation rows
 * @param spendableMinor the amount the allocator had to divide, in paise
 * @returns warnings in the order a planner would check them
 */
export function budgetWarnings(
  plan: Plan,
  categories: readonly CategoryAllocation[],
  spendableMinor: number,
): BudgetWarning[] {
  const { intake } = plan;
  const totalMinor = intake.budgetMinor;
  return [
    ...noBudgetWarnings(totalMinor),
    ...cateringWarnings(categories),
    ...venueWarnings(intake, categories),
    ...priorityWarnings(intake),
    ...unallocatedWarnings(categories, spendableMinor),
    ...quoteWarnings(plan, totalMinor),
  ];
}
