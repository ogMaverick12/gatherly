import type { Plan } from '@/lib/plan';
import type { BudgetAllocation } from '@/features/budget/services';
import type { VendorCoverage } from '@/features/vendors/services';
import type { TimelineSummary } from '@/features/timeline/services';

/**
 * Plan health.
 *
 * Five explainable parts, each with a published weight, an explanation of
 * what was measured and a concrete next action. This is a planning
 * heuristic - the app says so, and always shows its inputs.
 */

export type HealthBand = 'on_track' | 'attention' | 'at_risk';

export interface HealthPart {
  readonly id: string;
  readonly label: string;
  readonly score: number;
  readonly weight: number;
  readonly whatWasMeasured: string;
  readonly nextActions: readonly string[];
}

export interface HealthReport {
  readonly score: number;
  readonly band: HealthBand;
  readonly parts: readonly HealthPart[];
  readonly formula: string;
  readonly nextAction: string | null;
}

export interface HealthInputs {
  readonly plan: Plan;
  readonly budget: BudgetAllocation;
  readonly coverage: VendorCoverage;
  readonly timeline: TimelineSummary;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function budgetPart(budget: BudgetAllocation): HealthPart {
  const weight = 25;
  let score = 100;
  const nextActions: string[] = [];

  for (const warning of budget.warnings) {
    if (warning.severity === 'attention') {
      score -= 18;
      nextActions.push(warning.title);
    } else {
      score -= 6;
    }
  }

  if (budget.totalMinor === 0) {
    score = 0;
    nextActions.unshift('Add a budget so the plan can be costed.');
  }
  if (budget.contingencyMinor > 0 && nextActions.length === 0) {
    nextActions.push('Nothing is wrong with the budget shape - spend it in order.');
  }

  return {
    id: 'budget',
    label: 'Budget shape',
    score: clamp(score),
    weight,
    whatWasMeasured:
      'How the budget divides across categories, whether a contingency is reserved, and whether the shares look plausible for this event type.',
    nextActions: nextActions.slice(0, 3),
  };
}

function timelinePart(timeline: TimelineSummary): HealthPart {
  const weight = 25;
  const progress = timeline.total > 0 ? (timeline.done / timeline.total) * 100 : 0;
  const penalty = timeline.overdue > 0 ? Math.min(40, timeline.overdue * 12) : 0;
  const score = clamp(progress - penalty);
  const nextActions: string[] = [];
  if (timeline.overdue > 0) {
    nextActions.push(
      `${timeline.overdue} milestone${timeline.overdue === 1 ? ' is' : 's are'} overdue - start with the earliest.`,
    );
  }
  if (timeline.nextUp) {
    nextActions.push(`Next: ${timeline.nextUp.title}.`);
  } else if (timeline.total > 0) {
    nextActions.push('Every milestone is done. Check the run of show once more.');
  }
  return {
    id: 'timeline',
    label: 'Timeline readiness',
    score,
    weight,
    whatWasMeasured:
      'How many milestones are complete, minus a penalty for anything already overdue.',
    nextActions: nextActions.slice(0, 3),
  };
}

function vendorPart(coverage: VendorCoverage): HealthPart {
  const weight = 25;
  const nextActions: string[] = [];
  if (coverage.nextAction) nextActions.push(coverage.nextAction);
  const notStarted = coverage.categories.filter((category) => category.status === 'not-started');
  for (const category of notStarted.slice(0, 2)) {
    nextActions.push(`No ${category.label.toLowerCase()} contact yet.`);
  }
  return {
    id: 'vendors',
    label: 'Vendor coverage',
    score: clamp(coverage.overallPercent),
    weight,
    whatWasMeasured:
      'The share of the planned vendor budget that is actually booked, counted against the budget lines.',
    nextActions: nextActions.slice(0, 3),
  };
}

function taskPart(plan: Plan): HealthPart {
  const weight = 15;
  const total = plan.tasks.length;
  const done = plan.tasks.filter((task) => task.done).length;
  const score = total > 0 ? (done / total) * 100 : 0;
  const nextActions: string[] = [];
  const nextTask = plan.tasks.find((task) => !task.done);
  if (nextTask) nextActions.push(`Next task: ${nextTask.title}.`);
  if (total === 0) {
    nextActions.push('Add the few tasks that only you can do.');
  }
  return {
    id: 'tasks',
    label: 'Task progress',
    score: clamp(score),
    weight,
    whatWasMeasured: 'The share of your own checklist that is ticked off.',
    nextActions: nextActions.slice(0, 3),
  };
}

interface GuestCheck {
  readonly label: string;
  readonly passed: boolean;
}

function guestPart(plan: Plan): HealthPart {
  const weight = 10;
  const checks: GuestCheck[] = [];

  const caterer = plan.vendors.find((vendor) => vendor.category === 'caterer');
  checks.push({
    label: 'A caterer is in the plan',
    passed: Boolean(caterer),
  });
  for (const need of plan.intake.dietary) {
    checks.push({
      label: `Dietary need recorded with the caterer: ${need}`,
      passed: caterer !== undefined && caterer.notes.trim().length > 0,
    });
  }
  for (const need of plan.intake.access) {
    const hasTask = plan.tasks.some(
      (task) =>
        task.area === 'accessibility' &&
        task.title.toLowerCase().includes(need.split(' ')[0] ?? ''),
    );
    checks.push({
      label: `Access need has a task: ${need}`,
      passed: hasTask,
    });
  }
  checks.push({
    label: 'A venue is booked',
    passed: plan.vendors.some(
      (vendor) => vendor.category === 'venue' && vendor.status === 'booked',
    ),
  });

  const passed = checks.filter((check) => check.passed).length;
  const score = checks.length > 0 ? (passed / checks.length) * 100 : 0;
  const failing = checks.filter((check) => !check.passed);

  return {
    id: 'guests',
    label: 'Guest experience',
    score: clamp(score),
    weight,
    whatWasMeasured:
      'Whether the needs you wrote down have actually reached the people who can act on them.',
    nextActions: failing.slice(0, 3).map((check) => `Still open: ${check.label}.`),
  };
}

export function computeHealth(inputs: HealthInputs): HealthReport {
  const parts: HealthPart[] = [
    budgetPart(inputs.budget),
    timelinePart(inputs.timeline),
    vendorPart(inputs.coverage),
    taskPart(inputs.plan),
    guestPart(inputs.plan),
  ];

  const total = parts.reduce((sum, part) => sum + part.score * (part.weight / 100), 0);
  const score = Math.round(total);
  const band: HealthBand = score >= 75 ? 'on_track' : score >= 50 ? 'attention' : 'at_risk';

  const nextAction =
    parts
      .slice()
      .sort((a, b) => a.score * a.weight - b.score * b.weight)
      .flatMap((part) => part.nextActions)[0] ?? null;

  return {
    score,
    band,
    parts,
    formula: parts.map((part) => `${part.label} ${part.weight}%`).join(' + '),
    nextAction,
  };
}
