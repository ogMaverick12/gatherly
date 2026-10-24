import type { Plan } from '@/lib/plan';
import { formatMinor, sharePercent } from '@/lib/money';
import type { BudgetAllocation } from '@/features/budget/services';
import type { VendorCoverage } from '@/features/vendors/services';
import type { TimelineSummary } from '@/features/timeline/services';
import type { HealthReport } from '@/features/health/services';
import type { CateringEstimate } from '@/features/catering/services';
import type { Risk } from '@/features/risks/services';

/**
 * Assistant - deterministic intent classification and answers.
 *
 * This is what runs when no AI provider is configured. It never pretends to
 * be a model: the response is built from the plan's own numbers, and the UI
 * labels it "Basic mode".
 */

export type AssistantIntent =
  'budget' | 'timeline' | 'vendors' | 'catering' | 'next-step' | 'general';

export interface PlanSnapshot {
  readonly eventType: Plan['intake']['eventType'];
  readonly eventDate: string | null;
  readonly guests: number;
  readonly cityTier: Plan['intake']['cityTier'];
  readonly currency: Plan['intake']['currency'];
  readonly budgetMinor: number;
  readonly contingencyMinor: number;
  readonly perGuestMinor: number;
  readonly categories: readonly {
    readonly label: string;
    readonly amountMinor: number;
    readonly sharePercent: number;
  }[];
  readonly healthScore: number;
  readonly healthBand: HealthReport['band'];
  readonly nextMilestone: string | null;
  readonly nextMilestoneDate: string | null;
  readonly overdueCount: number;
  readonly milestonesDone: number;
  readonly milestonesTotal: number;
  readonly vendorCoveragePercent: number;
  readonly outstandingVendors: readonly string[];
  readonly plates: number;
  readonly drinks: number;
  readonly dietary: readonly string[];
  readonly tasksDone: number;
  readonly tasksTotal: number;
  readonly topRisks: readonly string[];
}

export function buildSnapshot(
  plan: Plan,
  budget: BudgetAllocation,
  coverage: VendorCoverage,
  timeline: TimelineSummary,
  health: HealthReport,
  catering: CateringEstimate,
  risks: readonly Risk[],
): PlanSnapshot {
  const outstanding = plan.vendors
    .filter((vendor) => vendor.status !== 'booked' && vendor.status !== 'declined')
    .map((vendor) => vendor.name || vendor.category);

  return {
    eventType: plan.intake.eventType,
    eventDate: plan.intake.eventDate,
    guests: plan.intake.guests,
    cityTier: plan.intake.cityTier,
    currency: plan.intake.currency,
    budgetMinor: budget.totalMinor,
    contingencyMinor: budget.contingencyMinor,
    perGuestMinor: plan.intake.guests > 0 ? Math.round(budget.totalMinor / plan.intake.guests) : 0,
    categories: budget.categories
      .filter((category) => category.amountMinor > 0)
      .map((category) => ({
        label: category.label,
        amountMinor: category.amountMinor,
        sharePercent: category.sharePercent,
      })),
    healthScore: health.score,
    healthBand: health.band,
    nextMilestone: timeline.nextUp?.title ?? null,
    nextMilestoneDate: timeline.nextUp?.date ?? null,
    overdueCount: timeline.overdue,
    milestonesDone: timeline.done,
    milestonesTotal: timeline.total,
    vendorCoveragePercent: coverage.overallPercent,
    outstandingVendors: outstanding.slice(0, 6),
    plates: catering.totalPlates,
    drinks: catering.drinks,
    dietary: catering.dietary.map((need) => need.label),
    tasksDone: plan.tasks.filter((task) => task.done).length,
    tasksTotal: plan.tasks.length,
    topRisks: risks.slice(0, 3).map((risk) => risk.title),
  };
}

const INTENT_KEYWORDS: Record<AssistantIntent, readonly string[]> = {
  // The order matters: on a tie the first intent wins, and the specific
  // subjects are checked before the broad one, so "how much is the food"
  // is about catering rather than about the budget in general.
  catering: [
    'food',
    'catering',
    'meal',
    'menu',
    'plate',
    'drink',
    'diet',
    'vegetarian',
    'vegan',
    'halal',
    'cake',
  ],
  vendors: [
    'vendor',
    'caterer',
    'photographer',
    'venue',
    'decorator',
    'dj',
    'book',
    'quote',
    'supplier',
  ],
  timeline: [
    'timeline',
    'schedule',
    'date',
    'when',
    'milestone',
    'order',
    'week before',
    'day before',
  ],
  'next-step': [
    'next',
    'what should i do',
    'what now',
    'priority',
    'first',
    'worry',
    'worried',
    'stuck',
  ],
  budget: [
    'budget',
    'money',
    'cost',
    'spend',
    'spending',
    'price',
    'expensive',
    'afford',
    'allocate',
  ],
  general: [],
};

export function classifyIntent(text: string): AssistantIntent {
  const normalised = text.toLowerCase();
  let best: AssistantIntent = 'general';
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [
    AssistantIntent,
    readonly string[],
  ][]) {
    if (intent === 'general') continue;
    let score = 0;
    for (const keyword of keywords) {
      if (normalised.includes(keyword)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  return bestScore > 0 ? best : 'general';
}

function money(minor: number, currency: PlanSnapshot['currency']): string {
  return formatMinor(minor, currency);
}

export function buildBasicAnswer(intent: AssistantIntent, snapshot: PlanSnapshot): string {
  const topCategories = snapshot.categories.slice(0, 3);

  switch (intent) {
    case 'budget': {
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
    case 'timeline': {
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
    case 'vendors': {
      const coverageText = `${snapshot.vendorCoveragePercent}% of the planned vendor budget is booked.`;
      if (snapshot.outstandingVendors.length === 0) {
        return `${coverageText} Nothing is outstanding, which is rarer than it sounds.`;
      }
      return `${coverageText} Still open: ${snapshot.outstandingVendors.join(', ')}. The Vendors tab shows the next action for each one.`;
    }
    case 'catering': {
      const dietaryText =
        snapshot.dietary.length > 0
          ? ` You have recorded ${snapshot.dietary.join(', ')} - confirm each one with the caterer in writing.`
          : ' No dietary needs are recorded, so ask the caterer anyway.';
      return `Plan for ${snapshot.plates} plates including the 8% buffer, with ${snapshot.drinks} drinks across the day.${dietaryText}`;
    }
    case 'next-step': {
      if (snapshot.topRisks.length > 0) {
        return `Three things are worth attention: ${snapshot.topRisks.join('; ')}. The Overview tab lists them with the fix next to each one.`;
      }
      if (snapshot.nextMilestone) {
        return `Nothing is flagged right now. The next thing on the plan is "${snapshot.nextMilestone}".`;
      }
      return 'Add a date and a budget, and the plan will start telling you what to do next.';
    }
    default: {
      return [
        `This plan is for ${snapshot.guests} guests with a budget of ${money(snapshot.budgetMinor, snapshot.currency)}.`,
        `Plan health is ${snapshot.healthScore} out of 100.`,
        'Ask about the budget, the timeline, the vendors, the food, or what to do next.',
      ].join(' ');
    }
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
