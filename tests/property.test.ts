import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  allocateByWeight,
  fromMajorUnits,
  sharePercent,
  sumMinor,
  toMajorUnits,
} from '@/lib/money';
import { computeBudget } from '@/features/budget/services';
import {
  buildMilestoneLadder,
  mergeMilestoneState,
  summariseTimeline,
} from '@/features/timeline/services';
import { computeRisks } from '@/features/risks/services';
import { computeVendorCoverage } from '@/features/vendors/services';
import { computeCatering } from '@/features/catering/services';
import { buildCalendar } from '@/lib/ics';
import { decodeShareFragment, encodeShareFragment } from '@/lib/share';
import { toCsv } from '@/lib/csv';
import { escapeCsvCell } from '@/lib/security/sanitize';
import { addDays, diffDays, type DateOnly } from '@/lib/dates';
import {
  ACCESS_NEEDS,
  CURRENCIES,
  CITY_TIERS,
  DIETARY_NEEDS,
  EVENT_TYPES,
  LANGUAGES,
  PACK_IDS,
  PRIORITIES,
  PlanSchema,
  VENUE_TYPES,
  createPlan,
  type Intake,
  type Plan,
} from '@/lib/plan';

/** The day the plan is looked at. Fixed, so no test depends on the clock. */
const TODAY = '2026-10-22';

/**
 * Property tests.
 *
 * These check invariants that a fixed example cannot: that the allocator
 * never loses a single minor unit, that the calendar export respects the
 * 75-octet line limit, that a share link survives a round trip. Each
 * property runs on many generated inputs so a rare input cannot slip past.
 */

const NOW = new Date('2026-01-01T00:00:00.000Z');

const dateOnlyArb = fc
  .tuple(
    fc.integer({ min: 2026, max: 2032 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }),
  )
  .map(
    ([year, month, day]) =>
      `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` as DateOnly,
  );

const intakeArb: fc.Arbitrary<Intake> = fc.record({
  eventType: fc.constantFrom(...EVENT_TYPES),
  eventDate: fc.option(dateOnlyArb, { nil: null }),
  guests: fc.integer({ min: 1, max: 2000 }),
  cityTier: fc.constantFrom(...CITY_TIERS),
  currency: fc.constantFrom(...CURRENCIES),
  budgetMinor: fc.integer({ min: 0, max: 50_000_000 }),
  priorities: fc.array(fc.constantFrom(...PRIORITIES), { maxLength: 4 }),
  cultureNote: fc.string({ maxLength: 60 }),
  dietary: fc.array(fc.constantFrom(...DIETARY_NEEDS), { maxLength: 5 }),
  access: fc.array(fc.constantFrom(...ACCESS_NEEDS), { maxLength: 5 }),
  language: fc.constantFrom(...LANGUAGES),
  packs: fc.array(fc.constantFrom(...PACK_IDS), { maxLength: 3 }),
  venueType: fc.constantFrom(...VENUE_TYPES),
  guestCountIsEstimate: fc.boolean(),
  notes: fc.string({ maxLength: 60 }),
});

const totalArb = fc.integer({ min: 0, max: 20_000_000 });
const weightsArb = fc.array(fc.integer({ min: 0, max: 500 }), { minLength: 1, maxLength: 12 });

/** UTF-8 length of a line, in octets, the way RFC 5545 counts them. */
function octets(value: string): number {
  return new TextEncoder().encode(value).length;
}

/** A plan with its ladder attached, the way the workspace holds it. */
function planWithLadder(intake: Intake, title?: string): Plan {
  const plan = createPlan(intake, NOW);
  const ladder = buildMilestoneLadder(plan, TODAY);
  return {
    ...plan,
    milestones: ladder.map((milestone) => ({
      id: milestone.id,
      title: title ?? milestone.title,
      date: milestone.date,
      offsetDays: milestone.offsetDays,
      done: milestone.done,
      owner: milestone.owner,
      whyItMatters: milestone.whyItMatters,
    })),
  };
}

describe('money invariants', () => {
  it('splits a total into parts that sum back to the total', () => {
    fc.assert(
      fc.property(totalArb, weightsArb, (total, weights) => {
        const parts = allocateByWeight(total, weights);
        expect(parts).toHaveLength(weights.length);
        if (sumMinor(weights) === 0) {
          expect(parts.every((part) => part === 0)).toBe(true);
          return;
        }
        expect(sumMinor(parts)).toBe(total);
      }),
    );
  });

  it('never allocates a negative amount', () => {
    fc.assert(
      fc.property(totalArb, weightsArb, (total, weights) => {
        for (const part of allocateByWeight(total, weights)) {
          expect(part).toBeGreaterThanOrEqual(0);
        }
      }),
    );
  });

  it('allocates the same way every time', () => {
    fc.assert(
      fc.property(totalArb, weightsArb, (total, weights) => {
        expect(allocateByWeight(total, weights)).toEqual(allocateByWeight(total, weights));
      }),
    );
  });

  it('gives a bigger weight a bigger share', () => {
    fc.assert(
      fc.property(totalArb, weightsArb, (total, weights) => {
        const parts = allocateByWeight(total, weights);
        for (let i = 0; i < weights.length; i += 1) {
          for (let j = 0; j < weights.length; j += 1) {
            const weightI = weights[i] ?? 0;
            const weightJ = weights[j] ?? 0;
            if (weightI > weightJ) {
              expect(parts[i] ?? 0).toBeGreaterThanOrEqual(parts[j] ?? 0);
            }
          }
        }
      }),
    );
  });

  it('keeps a major-unit amount on the same minor unit', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.constantFrom(...CURRENCIES),
        (major, currency) => {
          const minor = fromMajorUnits(major, currency);
          expect(toMajorUnits(minor, currency)).toBeCloseTo(major, 6);
          expect(fromMajorUnits(toMajorUnits(minor, currency), currency)).toBe(minor);
        },
      ),
    );
  });

  it('reports no share of a zero total', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 1000 }), (part) => {
        expect(sharePercent(part, 0)).toBe(0);
      }),
    );
  });
});

describe('budget invariants', () => {
  it('never spends more than the plan', () => {
    fc.assert(
      fc.property(intakeArb, (intake) => {
        const plan = createPlan(intake, NOW);
        const budget = computeBudget(plan);
        expect(sumMinor(budget.categories.map((category) => category.amountMinor))).toBe(
          budget.committedMinor,
        );
        expect(budget.committedMinor + budget.contingencyMinor).toBe(budget.totalMinor);
      }),
    );
  });

  it('never puts a per-guest figure above the category it comes from', () => {
    fc.assert(
      fc.property(intakeArb, (intake) => {
        const plan = createPlan(intake, NOW);
        const budget = computeBudget(plan);
        for (const category of budget.categories) {
          if (category.perGuestMinor === null) continue;
          expect(category.perGuestMinor).toBeLessThanOrEqual(category.amountMinor);
          expect(category.perGuestMinor).toBeGreaterThanOrEqual(0);
        }
      }),
    );
  });

  it('keeps the category shares close to one hundred', () => {
    fc.assert(
      fc.property(intakeArb, (intake) => {
        const plan = createPlan(intake, NOW);
        const budget = computeBudget(plan);
        if (budget.totalMinor === 0) {
          expect(budget.categories.every((category) => category.sharePercent === 0)).toBe(true);
          return;
        }
        const totalShare = sumMinor(
          budget.categories.map((category) => Math.round(category.sharePercent * 10)),
        );
        expect(Math.abs(totalShare - 1000)).toBeLessThanOrEqual(6);
      }),
    );
  });
});

describe('timeline invariants', () => {
  it('sorts the ladder by date', () => {
    fc.assert(
      fc.property(intakeArb, (intake) => {
        const plan = createPlan(intake, NOW);
        const dates = buildMilestoneLadder(plan, TODAY)
          .map((milestone) => milestone.date)
          .filter((date): date is DateOnly => date !== null);
        const sorted = [...dates].sort();
        expect(dates).toEqual(sorted);
      }),
    );
  });

  it('never schedules a milestone after the event', () => {
    fc.assert(
      fc.property(intakeArb, (intake) => {
        if (!intake.eventDate) return;
        const plan = createPlan(intake, NOW);
        for (const milestone of buildMilestoneLadder(plan, TODAY)) {
          if (!milestone.date) continue;
          expect(milestone.date <= intake.eventDate).toBe(true);
        }
      }),
    );
  });

  it('keeps date arithmetic reversible', () => {
    fc.assert(
      fc.property(dateOnlyArb, fc.integer({ min: -400, max: 400 }), (date, days) => {
        expect(diffDays(date, addDays(date, days))).toBe(days);
      }),
    );
  });
});

describe('calendar export invariants', () => {
  it('keeps every line inside the 75 octet limit', () => {
    fc.assert(
      fc.property(intakeArb, fc.constantFrom(...LANGUAGES), (intake, locale) => {
        const plan = planWithLadder(intake);
        const calendar = buildCalendar(plan, { now: NOW, locale });
        for (const line of calendar.split('\r\n')) {
          expect(octets(line)).toBeLessThanOrEqual(75);
        }
      }),
    );
  });

  it('keeps lines inside the limit when the text is not Latin', () => {
    fc.assert(
      fc.property(
        fc.string({ unit: 'grapheme', minLength: 40, maxLength: 120 }),
        intakeArb,
        (longText, intake) => {
          const plan = planWithLadder(intake, longText);
          const calendar = buildCalendar(plan, { now: NOW, locale: 'hi' });
          for (const line of calendar.split('\r\n')) {
            expect(octets(line)).toBeLessThanOrEqual(75);
          }
        },
      ),
    );
  });

  it('writes one event per dated milestone, plus the event itself', () => {
    fc.assert(
      fc.property(intakeArb, (intake) => {
        const plan = planWithLadder(intake);
        const calendar = buildCalendar(plan, { now: NOW });
        const dated = plan.milestones.filter((milestone) => milestone.date).length;
        const expected = dated + (intake.eventDate ? 1 : 0);
        expect(calendar.split('BEGIN:VEVENT').length - 1).toBe(expected);
      }),
    );
  });
});

describe('share link invariants', () => {
  it('returns the same plan after a round trip', async () => {
    await fc.assert(
      fc.asyncProperty(intakeArb, async (intake) => {
        const plan = createPlan(intake, NOW);
        const fragment = await encodeShareFragment(plan);
        const decoded = await decodeShareFragment(fragment);
        expect(decoded).not.toBeNull();
        expect(decoded?.intake).toEqual(plan.intake);
        expect(decoded?.tasks).toEqual(plan.tasks);
        expect(decoded?.vendors).toEqual(plan.vendors);
      }),
    );
  });

  it('rejects a fragment that was never a share link', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ maxLength: 40 }), async (noise) => {
        expect(await decodeShareFragment(noise)).toBeNull();
      }),
    );
  });
});

describe('csv invariants', () => {
  it('defuses every cell that looks like a formula', () => {
    fc.assert(
      fc.property(
        fc.array(fc.stringMatching(/^[=+\-@\t\r].{0,20}$/), { minLength: 1, maxLength: 6 }),
        (cells) => {
          const csv = toCsv(cells.map((cell) => [cell]));
          for (const line of csv.split('\r\n')) {
            const content = line.slice(1, -1);
            expect(/^[=+\-@\t\r]/.test(content)).toBe(false);
          }
        },
      ),
    );
  });

  it('quotes every cell and doubles the quotes inside it', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 30 }), (value) => {
        const cell = escapeCsvCell(value);
        expect(cell.startsWith('"')).toBe(true);
        expect(cell.endsWith('"')).toBe(true);
        const inner = cell.slice(1, -1).replace(/""/g, '"');
        expect(inner).toBe(
          value.startsWith('=') ||
            value.startsWith('+') ||
            value.startsWith('-') ||
            value.startsWith('@') ||
            value.startsWith('\t') ||
            value.startsWith('\r')
            ? `'${value}`
            : value,
        );
      }),
    );
  });
});

describe('plan invariants', () => {
  it('always produces a plan the schema accepts', () => {
    fc.assert(
      fc.property(intakeArb, (intake) => {
        const plan = createPlan(intake, NOW);
        expect(PlanSchema.safeParse(plan).success).toBe(true);
      }),
    );
  });

  it('sorts risks from serious to quiet', () => {
    fc.assert(
      fc.property(intakeArb, (intake) => {
        const plan = createPlan(intake, NOW);
        const budget = computeBudget(plan);
        const allocation = Object.fromEntries(
          budget.categories.map((category) => [category.id, category.amountMinor]),
        ) as never;
        const coverage = computeVendorCoverage(plan, allocation);
        const milestones = mergeMilestoneState(plan.milestones, buildMilestoneLadder(plan, TODAY));
        const timeline = summariseTimeline(milestones, '2026-06-01');
        const catering = computeCatering(plan);
        const risks = computeRisks({ plan, budget, coverage, timeline, catering });
        const order = { high: 0, medium: 1, low: 2 } as const;
        const severities = risks.map((risk) => order[risk.severity]);
        expect([...severities].sort()).toEqual(severities);
      }),
    );
  });
});
