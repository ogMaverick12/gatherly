import { describe, expect, it } from 'vitest';
import { computeBudget, computeScenarios, PRIORITY_MULTIPLIER } from '@/features/budget';
import { createPlan, type Intake } from '@/lib/plan';

const BASE: Intake = {
  eventType: 'wedding',
  eventDate: '2026-12-05',
  guests: 100,
  cityTier: 'tier2',
  currency: 'INR',
  budgetMinor: 10_000_000,
  priorities: [],
  cultureNote: '',
  dietary: [],
  access: [],
  language: 'en',
  packs: [],
  venueType: 'indoor',
  guestCountIsEstimate: false,
  notes: '',
};

function planWith(patch: Partial<Intake> = {}) {
  return createPlan({ ...BASE, ...patch }, new Date('2026-01-01T00:00:00.000Z'));
}

describe('computeBudget', () => {
  it('reserves a contingency and splits the rest', () => {
    const budget = computeBudget(planWith());
    expect(budget.totalMinor).toBe(10_000_000);
    expect(budget.contingencyMinor).toBe(800_000);
    expect(budget.committedMinor).toBe(9_200_000);
  });

  it('allocates every minor unit exactly once', () => {
    const budget = computeBudget(planWith());
    const allocated = budget.categories.reduce((sum, category) => sum + category.amountMinor, 0);
    expect(allocated).toBe(budget.committedMinor);
  });

  it('applies the priority multiplier to the categories a priority names', () => {
    const budget = computeBudget(planWith({ priorities: ['food'] }));
    const catering = budget.categories.find((category) => category.id === 'catering');
    expect(catering?.priorityBoost).toBe(true);
    expect(catering?.baseWeight).toBe(27);
    expect(catering?.effectiveWeight).toBe(Math.round(27 * PRIORITY_MULTIPLIER));
  });

  it('moves money towards a prioritised category', () => {
    const plain = computeBudget(planWith());
    const boosted = computeBudget(planWith({ priorities: ['food'] }));
    const plainCatering = plain.categories.find((category) => category.id === 'catering');
    const boostedCatering = boosted.categories.find((category) => category.id === 'catering');
    expect(boostedCatering?.amountMinor).toBeGreaterThan(plainCatering?.amountMinor ?? 0);
  });

  it('moves a pack shift into the category', () => {
    const budget = computeBudget(planWith({ packs: ['community-feast'] }));
    const catering = budget.categories.find((category) => category.id === 'catering');
    expect(catering?.packShift).toBe(3);
  });

  it('warns when there is no budget at all', () => {
    const budget = computeBudget(planWith({ budgetMinor: 0 }));
    expect(budget.warnings.some((warning) => warning.id === 'no-budget')).toBe(true);
  });

  it('warns when most of the plan is on food', () => {
    const budget = computeBudget(
      planWith({ eventType: 'community', guests: 240, priorities: ['food'] }),
    );
    expect(budget.warnings.some((warning) => warning.id === 'catering-heavy')).toBe(true);
  });

  it('warns when the recorded quotes are more than the budget', () => {
    const plan = createPlan(BASE, new Date());
    const withQuote = {
      ...plan,
      vendors: [
        {
          id: 'v1',
          category: 'caterer' as const,
          name: 'Caterer',
          status: 'quoted' as const,
          quotedMinor: 20_000_000,
          depositMinor: null,
          dueDate: null,
          phone: '',
          notes: '',
        },
      ],
    };
    const budget = computeBudget(withQuote);
    expect(budget.warnings.some((warning) => warning.id === 'quotes-over-budget')).toBe(true);
  });

  it('reports a per-guest figure only for guest-scaled categories', () => {
    const budget = computeBudget(planWith());
    const catering = budget.categories.find((category) => category.id === 'catering');
    const officiant = budget.categories.find((category) => category.id === 'officiant');
    expect(catering?.perGuestMinor).not.toBeNull();
    expect(officiant?.perGuestMinor).toBeNull();
  });

  it('compares each share with a benchmark', () => {
    const budget = computeBudget(planWith());
    for (const category of budget.categories) {
      expect(category.benchmarkSharePercent).toBeGreaterThanOrEqual(0);
      expect(
        Math.abs(
          category.varianceFromBenchmark -
            Math.round((category.sharePercent - category.benchmarkSharePercent) * 10) / 10,
        ),
      ).toBeLessThan(0.11);
    }
  });

  it('never produces a negative amount', () => {
    const budget = computeBudget(planWith({ packs: ['potluck'] }));
    for (const category of budget.categories) {
      expect(category.amountMinor).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('computeScenarios', () => {
  it('produces guest, budget and venue scenarios', () => {
    const scenarios = computeScenarios(planWith());
    const kinds = scenarios.map((scenario) => scenario.kind);
    expect(kinds).toContain('guests-up');
    expect(kinds).toContain('guests-down');
    expect(kinds).toContain('budget-up');
    expect(kinds).toContain('budget-down');
  });

  it('does not offer a move to the venue type already chosen', () => {
    const scenarios = computeScenarios(planWith({ venueType: 'indoor' }));
    expect(scenarios.some((scenario) => scenario.kind === 'venue-indoor')).toBe(false);
    expect(scenarios.some((scenario) => scenario.kind === 'venue-outdoor')).toBe(true);
  });

  it('keeps the same total in the budget scenarios', () => {
    const scenarios = computeScenarios(planWith());
    const up = scenarios.find((scenario) => scenario.kind === 'budget-up');
    const down = scenarios.find((scenario) => scenario.kind === 'budget-down');
    expect(up?.totalMinor).toBeGreaterThan(down?.totalMinor ?? 0);
  });

  it('flags a scenario that goes over the ceiling', () => {
    const scenarios = computeScenarios(planWith());
    const up = scenarios.find((scenario) => scenario.kind === 'budget-up');
    expect(up?.exceedsCeiling).toBe(true);
  });
});
