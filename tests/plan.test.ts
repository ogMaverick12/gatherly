import { describe, expect, it } from 'vitest';
import {
  CURRENCY_META,
  PACKS,
  PACK_IDS,
  PlanSchema,
  createPlan,
  createSamplePlan,
  parsePlan,
  SAMPLE_PLAN_TEMPLATES,
} from '@/lib/plan';
import { todayDateOnly } from '@/lib/dates';
import { computePlanView } from '@/lib/plan-view';
import { asInvalid, TEST_INTAKE as INTAKE } from './factories';

describe('the plan schema', () => {
  it('accepts a well-formed plan', () => {
    const plan = createPlan(INTAKE, new Date('2026-01-01T00:00:00.000Z'));
    const parsed = PlanSchema.safeParse(plan);
    expect(parsed.success).toBe(true);
  });

  it('rejects an unknown currency', () => {
    const plan = createPlan({ ...INTAKE, currency: asInvalid('XYZ') }, new Date());
    expect(PlanSchema.safeParse(plan).success).toBe(false);
  });

  it('rejects a plan with a fractional budget', () => {
    const plan = { ...createPlan(INTAKE, new Date()), intake: { ...INTAKE, budgetMinor: 10.5 } };
    expect(PlanSchema.safeParse(plan).success).toBe(false);
  });

  it('rejects unknown keys', () => {
    const plan: unknown = { ...createPlan(INTAKE, new Date()), surprise: true };
    expect(PlanSchema.safeParse(plan).success).toBe(false);
  });

  it('rejects more than four priorities', () => {
    const plan = createPlan(
      { ...INTAKE, priorities: asInvalid(['food', 'music', 'decor', 'photography', 'logistics']) },
      new Date(),
    );
    expect(PlanSchema.safeParse(plan).success).toBe(false);
  });

  it('rejects a date that is not YYYY-MM-DD', () => {
    const plan = createPlan({ ...INTAKE, eventDate: '05/12/2026' }, new Date());
    expect(PlanSchema.safeParse(plan).success).toBe(false);
  });

  it('discards an invalid plan instead of crashing', () => {
    expect(parsePlan({ version: 99 }).success).toBe(false);
    expect(parsePlan(null).success).toBe(false);
  });
});

describe('createPlan', () => {
  it('stamps both timestamps and keeps the intake', () => {
    const now = new Date('2026-03-04T05:06:07.000Z');
    const plan = createPlan(INTAKE, now);
    expect(plan.createdAt).toBe(now.toISOString());
    expect(plan.updatedAt).toBe(now.toISOString());
    expect(plan.intake).toEqual(INTAKE);
    expect(plan.tasks).toEqual([]);
  });
});

describe('sample plans', () => {
  it('creates an editable plan with tasks, vendors and a date', () => {
    const template = SAMPLE_PLAN_TEMPLATES[0];
    expect(template).toBeDefined();
    if (!template) return;

    const plan = createSamplePlan(template, new Date('2026-01-01T00:00:00.000Z'));
    expect(plan.intake.eventDate).not.toBeNull();
    expect(plan.tasks.length).toBeGreaterThan(0);
    expect(plan.vendors.length).toBeGreaterThan(0);
    expect(PlanSchema.safeParse(plan).success).toBe(true);
  });

  it('uses a different currency per sample so no conversion is implied', () => {
    const currencies = SAMPLE_PLAN_TEMPLATES.map((template) => template.intake.currency);
    expect(new Set(currencies).size).toBe(currencies.length);
  });

  it('never pre-selects a pack the user did not choose', () => {
    for (const template of SAMPLE_PLAN_TEMPLATES) {
      const plan = createSamplePlan(template, new Date());
      for (const pack of plan.intake.packs) {
        expect(PACK_IDS).toContain(pack);
      }
    }
  });

  it('starts with real progress and a real healthy score', () => {
    for (const template of SAMPLE_PLAN_TEMPLATES) {
      const now = new Date('2026-01-01T00:00:00.000Z');
      const plan = createSamplePlan(template, now);
      const view = computePlanView(plan, todayDateOnly(now));
      expect(view.timeline.done, template.id).toBeGreaterThanOrEqual(3);
      expect(view.coverage.bookedMinor, template.id).toBeGreaterThan(0);
      expect(view.health.score, template.id).toBeGreaterThanOrEqual(55);
      expect(view.health.score, template.id).toBeLessThanOrEqual(70);
    }
  });
});

describe('packs', () => {
  it('are opt-in starting points with tasks and budget shifts', () => {
    for (const id of PACK_IDS) {
      const pack = PACKS[id];
      expect(pack.id).toBe(id);
      expect(pack.name.length).toBeGreaterThan(0);
      expect(Array.isArray(pack.addsTasks)).toBe(true);
    }
  });
});

describe('currency metadata', () => {
  it('gives every currency a symbol and a minor unit count', () => {
    for (const [code, meta] of Object.entries(CURRENCY_META)) {
      expect(meta.code).toBe(code);
      expect([0, 2]).toContain(meta.minorUnits);
      expect(meta.symbol.length).toBeGreaterThan(0);
    }
  });
});
