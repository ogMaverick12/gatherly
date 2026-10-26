import type { z } from 'zod';
import { addDays, todayDateOnly } from '../dates';
import { PLAN_VERSION, PlanSchema, type Intake, type Plan, type PlanSettings } from './schemas';
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

  return {
    ...plan,
    tasks: template.tasks.map((task, index) => ({
      id: `task_${index + 1}_${slug(task.title)}`,
      title: task.title,
      done: false,
      area: task.area,
    })),
    vendors: template.vendors.map((vendor, index) => ({
      id: `vendor_${index + 1}_${vendor.category}`,
      category: vendor.category,
      name: vendor.name,
      status: vendor.status,
      quotedMinor: null,
      depositMinor: null,
      dueDate: null,
      phone: '',
      notes: vendor.notes,
    })),
  };
}

/** Parse untrusted JSON (localStorage, share links) into a plan. */
export function parsePlan(input: unknown): z.SafeParseReturnType<unknown, Plan> {
  return PlanSchema.safeParse(input);
}
