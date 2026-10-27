import type { Plan } from '@/lib/plan';
import { formatMinorPlain, sumMinor } from '@/lib/money';
import {
  BASE_WEIGHTS,
  CATERING_HEAVY_PERCENT,
  PRIORITY_CATEGORY_MAP,
  VENUE_LIGHT_PERCENT,
} from './weights';
import type { BudgetWarning, CategoryAllocation } from './types';

/**
 * The warnings a budget raises: each one names what was measured and what the
 * user can do about it, built from the allocation so the numbers in them are
 * the numbers on screen.
 * long-function: each warning is a short branch over the same allocation, and the list reads in the order a planner would check.
 */
export function budgetWarnings(
  plan: Plan,
  categories: readonly CategoryAllocation[],
  spendableMinor: number,
): BudgetWarning[] {
  const { intake } = plan;
  const totalMinor = intake.budgetMinor;
  const baseWeights = BASE_WEIGHTS[intake.eventType];

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

  return warnings;
}
