/**
 * The deterministic assistant answers.
 *
 * Every answer is built from the plan snapshot alone, so Basic mode needs no model.
 */

import { formatMoney, sharePercent } from '@/lib/money';
import type { AssistantIntent } from './intent';
import type { PlanSnapshot } from './snapshot';

/** Format an integer minor-unit amount for an answer. */
function money(minor: number, currency: PlanSnapshot['currency']): string {
  return formatMoney(minor, currency);
}

/** The budget answer, including the largest lines and health caveat. */
function budgetAnswer(snapshot: PlanSnapshot, topCategories: PlanSnapshot['categories']): string {
  const lines = [
    `Your budget is ${money(snapshot.budgetMinor, snapshot.currency)} for ${snapshot.guests} guests, which is ${money(snapshot.perGuestMinor, snapshot.currency)} per guest including the reserve.`,
    `${money(snapshot.contingencyMinor, snapshot.currency)} is held back as an 8% contingency.`,
  ];
  if (topCategories.length > 0) {
    lines.push(
      `The largest lines are ${topCategories
        .map((category) => `${category.label} (${category.sharePercent}%)`)
        .join(', ')}.`,
    );
  }
  if (snapshot.healthBand === 'attention' || snapshot.healthBand === 'at_risk') {
    lines.push(
      'The Budget tab shows the full arithmetic and any warnings, including where the plan differs from a typical split.',
    );
  }
  return lines.join(' ');
}

/** The timeline answer, warning about overdue milestones when needed. */
function timelineAnswer(snapshot: PlanSnapshot): string {
  if (snapshot.nextMilestone) {
    const when = snapshot.nextMilestoneDate ? ` (${snapshot.nextMilestoneDate})` : '';
    return `The next milestone is "${snapshot.nextMilestone}"${when}. You have finished ${snapshot.milestonesDone} of ${snapshot.milestonesTotal}.${
      snapshot.overdueCount > 0
        ? ` ${snapshot.overdueCount} milestone${snapshot.overdueCount === 1 ? ' is' : 's are'} already overdue - start with the earliest.`
        : ''
    }`;
  }
  return 'Set the event date and the Timeline tab will build a backwards plan with the dates attached.';
}

/** The vendor coverage answer, listing anything still outstanding. */
function vendorsAnswer(snapshot: PlanSnapshot): string {
  const coverageText = `${snapshot.vendorCoveragePercent}% of the planned vendor budget is booked.`;
  if (snapshot.outstandingVendors.length === 0) {
    return `${coverageText} Nothing is outstanding, which is rarer than it sounds.`;
  }
  return `${coverageText} Still open: ${snapshot.outstandingVendors.join(', ')}. The Vendors tab shows the next action for each one.`;
}

/** The catering answer, including the dietary reminder. */
function cateringAnswer(snapshot: PlanSnapshot): string {
  const dietaryText =
    snapshot.dietary.length > 0
      ? ` You have recorded ${snapshot.dietary.join(', ')} - confirm each one with the caterer in writing.`
      : ' No dietary needs are recorded, so ask the caterer anyway.';
  return `Plan for ${snapshot.plates} plates including the 8% buffer, with ${snapshot.drinks} drinks across the day.${dietaryText}`;
}

/** The next-step answer, from risks and the next milestone. */
function nextStepAnswer(snapshot: PlanSnapshot): string {
  if (snapshot.topRisks.length > 0) {
    return `Three things are worth attention: ${snapshot.topRisks.join('; ')}. The Overview tab lists them with the fix next to each one.`;
  }
  if (snapshot.nextMilestone) {
    return `Nothing is flagged right now. The next thing on the plan is "${snapshot.nextMilestone}".`;
  }
  return 'Add a date and a budget, and the plan will start telling you what to do next.';
}

/** The fallback answer for an intent with no dedicated reply. */
function defaultAnswer(snapshot: PlanSnapshot): string {
  return [
    `This plan is for ${snapshot.guests} guests with a budget of ${money(snapshot.budgetMinor, snapshot.currency)}.`,
    `Plan health is ${snapshot.healthScore} out of 100.`,
    'Ask about the budget, the timeline, the vendors, the food, or what to do next.',
  ].join(' ');
}

/**
 * Writes the plain-language answer for one intent from the plan snapshot.
 * @param intent the subject the user asked about
 * @param snapshot the numbers already computed for the plan
 * @returns a short answer in English with the user's own figures
 */
export function buildBasicAnswer(intent: AssistantIntent, snapshot: PlanSnapshot): string {
  const topCategories = snapshot.categories.slice(0, 3);
  switch (intent) {
    case 'budget':
      return budgetAnswer(snapshot, topCategories);
    case 'timeline':
      return timelineAnswer(snapshot);
    case 'vendors':
      return vendorsAnswer(snapshot);
    case 'catering':
      return cateringAnswer(snapshot);
    case 'next-step':
      return nextStepAnswer(snapshot);
    default:
      return defaultAnswer(snapshot);
  }
}

/**
 * A compact, bounded rendering of the plan for a language model.
 * The model never receives free text from the user except inside the
 * explicitly delimited user input block.
 */
export function renderSnapshotForModel(snapshot: PlanSnapshot): string {
  const lines = [
    `event_type=${snapshot.eventType}`,
    `event_date=${snapshot.eventDate ?? 'not set'}`,
    `guests=${snapshot.guests}`,
    `city_tier=${snapshot.cityTier}`,
    `currency=${snapshot.currency}`,
    `budget_minor=${snapshot.budgetMinor}`,
    `contingency_minor=${snapshot.contingencyMinor}`,
    `per_guest_minor=${snapshot.perGuestMinor}`,
    `health_score=${snapshot.healthScore}`,
    `vendor_coverage_percent=${snapshot.vendorCoveragePercent}`,
    `plates=${snapshot.plates}`,
    `milestones_done=${snapshot.milestonesDone}/${snapshot.milestonesTotal}`,
    `overdue=${snapshot.overdueCount}`,
    `tasks_done=${snapshot.tasksDone}/${snapshot.tasksTotal}`,
    `next_milestone=${snapshot.nextMilestone ?? 'none'}`,
    `dietary=${snapshot.dietary.join(', ') || 'none recorded'}`,
    'budget_lines:',
    ...snapshot.categories.map(
      (category) => `  - ${category.label}: ${category.amountMinor} (${category.sharePercent}%)`,
    ),
  ];
  return lines.join('\n');
}

/** The share of the budget the largest line holds, used by the overview. */
export function topShare(snapshot: PlanSnapshot): number {
  const top = snapshot.categories[0];
  return top ? sharePercent(top.amountMinor, snapshot.budgetMinor) : 0;
}
