import { ACCESS_LABELS, DIETARY_LABELS, type Plan } from '@/lib/plan';
import type { BudgetAllocation } from '@/features/budget/services';
import type { VendorCoverage } from '@/features/vendors/services';
import type { TimelineSummary } from '@/features/timeline/services';
import type { HealthPart } from './types';

/** The five measurements that make up the score. */

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Scores the budget shape from its warnings, out of 100, weighted 25.
 * @param budget the allocation whose warnings are counted
 * @returns the weighted part with the reason and next actions
 */
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

/**
 * Scores timeline progress and overdue penalties, out of 100, weighted 25.
 * @param timeline the merged ladder summary
 * @returns the weighted part with its next actions
 */
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

/**
 * Scores the share of the vendor budget that is booked, out of 100, weighted 25.
 * @param coverage the per-category vendor coverage
 * @returns the weighted part with the next vendor to chase
 */
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

/**
 * Scores the share of the user's own tasks done, out of 100, weighted 15.
 * @param plan the stored plan whose tasks are counted
 * @returns the weighted part with the next open task
 */
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

/** Collect the guest, dietary, access and venue checks in display order. */
function guestChecks(plan: Plan): GuestCheck[] {
  const checks: GuestCheck[] = [];
  const caterer = plan.vendors.find((vendor) => vendor.category === 'caterer');
  checks.push({
    label: 'A caterer is in the plan',
    passed: Boolean(caterer),
  });
  for (const need of plan.intake.dietary) {
    checks.push({
      label: `Dietary need recorded with the caterer: ${DIETARY_LABELS[need]}`,
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
      label: `Access need has a task: ${ACCESS_LABELS[need]}`,
      passed: hasTask,
    });
  }
  checks.push({
    label: 'A venue is booked',
    passed: plan.vendors.some(
      (vendor) => vendor.category === 'venue' && vendor.status === 'booked',
    ),
  });
  return checks;
}

/**
 * Scores whether recorded guest needs have a task or a caterer behind them, out of 100, weighted 10.
 * @param plan the stored plan whose vendors, tasks and needs are checked
 * @returns the weighted part listing the checks still open
 */
function guestPart(plan: Plan): HealthPart {
  const weight = 10;
  const checks = guestChecks(plan);
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

export { budgetPart, timelinePart, vendorPart, taskPart, guestPart };
