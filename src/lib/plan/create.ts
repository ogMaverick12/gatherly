import type { z } from 'zod';
import { addDays, todayDateOnly } from '../dates';
import { PLAN_VERSION, PlanSchema, type Intake, type Plan, type PlanSettings } from './schemas';
import { SAMPLE_MILESTONE_SEEDS } from './sample-milestones';
import type { SamplePlanTemplate } from './samples';

/**
 * Building and reading plans.
 *
 * Every function here takes its clock as an argument: nothing in this module
 * reads the time itself, so a test can place a plan anywhere on the calendar.
 */

/** Settings a brand new plan starts with, before the user changes anything. */
export const DEFAULT_SETTINGS: PlanSettings = {
  theme: 'system',
  textSize: 'standard',
  calmMode: false,
  reducedMotion: false,
};

/** Create an empty plan for an intake: no tasks, vendors, ideas or chat yet. */
export function createPlan(
  intake: Intake,
  now: Date,
  id = `plan_${now.getTime().toString(36)}`,
): Plan {
  const timestamp = now.toISOString();
  return {
    version: PLAN_VERSION,
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
    intake: { ...intake },
    tasks: [],
    vendors: [],
    milestones: [],
    ideas: [],
    chat: [],
    settings: { ...DEFAULT_SETTINGS },
  };
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

/** A sample starts with a little real progress, not a blank checklist. */
const SAMPLE_DONE_TASKS = 3;

/** Turn the sample's milestone ids into stored, completed milestones. */
function sampleMilestones(ids: readonly string[]): Plan['milestones'] {
  return ids.flatMap((id) => {
    const seed = SAMPLE_MILESTONE_SEEDS[id];
    if (!seed) return [];
    return [
      {
        id: seed.id,
        title: seed.title,
        date: null,
        offsetDays: -seed.offsetDays,
        done: true,
        owner: seed.owner,
        whyItMatters: seed.whyItMatters,
      },
    ];
  });
}

/**
 * Build a complete, editable plan from a sample template.
 * The sample is a starting point the user then changes - it is not a
 * read-only fixture.
 */
export function createSamplePlan(template: SamplePlanTemplate, now: Date): Plan {
  const plan = createPlan(
    {
      ...template.intake,
      eventDate: addDays(todayDateOnly(now), template.daysFromNow),
    },
    now,
    `sample_${template.id}_${now.getTime().toString(36)}`,
  );
  const milestones = sampleMilestones(template.doneMilestones);

  return {
    ...plan,
    tasks: template.tasks.map((task, index) => ({
      id: `task_${index + 1}_${slug(task.title)}`,
      title: task.title,
      done: index < SAMPLE_DONE_TASKS,
      area: task.area,
    })),
    vendors: template.vendors.map((vendor, index) => ({
      id: `vendor_${index + 1}_${vendor.category}`,
      category: vendor.category,
      name: vendor.name,
      status: vendor.status,
      quotedMinor: vendor.quotedMinor ?? null,
      depositMinor: null,
      dueDate: null,
      phone: '',
      notes: vendor.notes,
    })),
    milestones,
  };
}

/**
 * Check whether a plan was opened from one of the built-in samples.
 *
 * @param plan the plan to inspect
 * @returns true when the id carries the sample prefix
 */
export function isSamplePlan(plan: Plan): boolean {
  return plan.id.startsWith('sample_');
}

/** Parse untrusted JSON (localStorage, share links) into a plan. */
export function parsePlan(input: unknown): z.ZodSafeParseResult<Plan> {
  return PlanSchema.safeParse(input);
}
