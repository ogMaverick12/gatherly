import { describe, expect, it } from 'vitest';
import { computeRisks } from '@/features/risks/services';
import { computeBudget } from '@/features/budget/services';
import { computeVendorCoverage } from '@/features/vendors/services';
import { computeCatering } from '@/features/catering/services';
import {
  buildMilestoneLadder,
  mergeMilestoneState,
  summariseTimeline,
} from '@/features/timeline/services';
import { createPlan, type Intake, type PlanTask, type Vendor } from '@/lib/plan';
import { computePlanView } from '@/lib/plan-view';

/** The day the plan is looked at. Fixed, so no test depends on the clock. */
const TODAY = '2026-10-22';

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

function risksFor(patch: Partial<Intake> = {}, vendors: Vendor[] = [], tasks: PlanTask[] = []) {
  const plan = {
    ...createPlan({ ...BASE, ...patch }, new Date('2026-01-01T00:00:00.000Z')),
    vendors,
    tasks,
  };
  const budget = computeBudget(plan);
  const allocation = computePlanView(plan, TODAY).allocationByCategory;
  const coverage = computeVendorCoverage(plan, allocation);
  const milestones = mergeMilestoneState(plan.milestones, buildMilestoneLadder(plan, TODAY));
  const timeline = summariseTimeline(milestones, '2026-11-25');
  const catering = computeCatering(plan);
  return computeRisks({ plan, budget, coverage, timeline, catering });
}

describe('computeRisks', () => {
  it('flags a plan with no budget', () => {
    const risks = risksFor({ budgetMinor: 0 });
    expect(risks.some((risk) => risk.id === 'no-budget')).toBe(true);
  });

  it('flags a missing venue close to the date', () => {
    const risks = risksFor();
    expect(risks.some((risk) => risk.id === 'venue-late')).toBe(true);
  });

  it('flags unconfirmed dietary needs', () => {
    const risks = risksFor({ dietary: ['vegan'] });
    expect(risks.some((risk) => risk.id === 'dietary-unconfirmed')).toBe(true);
  });

  it('flags an access need with no task behind it', () => {
    const risks = risksFor({ access: ['wheelchair'] });
    expect(risks.some((risk) => risk.id === 'access-wheelchair')).toBe(true);
  });

  it('groups several access needs into one readable risk', () => {
    const risks = risksFor({ access: ['reserved-seating', 'rest-area'] });
    const grouped = risks.find((risk) => risk.id === 'access-needs');
    expect(grouped?.title).toBe('2 access needs have no task behind them');
    expect(grouped?.explanation).toContain('Reserved seating');
    expect(grouped?.explanation).toContain('Rest area for elders');
    expect(JSON.stringify(grouped)).not.toContain('reserved-seating');
    expect(JSON.stringify(grouped)).not.toContain('rest-area');
  });

  it('is satisfied when the access need has a task', () => {
    const risks = risksFor(
      { access: ['wheelchair'] },
      [],
      [
        {
          id: 't1',
          title: 'Confirm the wheelchair step-free route',
          done: false,
          area: 'accessibility',
        },
      ],
    );
    expect(risks.some((risk) => risk.id === 'access-wheelchair')).toBe(false);
  });

  it('sorts the most serious risk first', () => {
    const risks = risksFor({ dietary: ['vegan'], access: ['wheelchair'] });
    const order = { high: 0, medium: 1, low: 2 } as const;
    const severities = risks.map((risk) => order[risk.severity]);
    expect([...severities].sort()).toEqual(severities);
  });

  it('explains and mitigates every risk', () => {
    for (const risk of risksFor({ dietary: ['vegan'] })) {
      expect(risk.explanation.length).toBeGreaterThan(0);
      expect(risk.mitigation.length).toBeGreaterThan(0);
    }
  });

  it('never names a religion, community or region', () => {
    const text = JSON.stringify(risksFor({ dietary: ['halal', 'kosher'] })).toLowerCase();
    for (const word of ['muslim', 'hindu', 'christian', 'jewish', 'sikh']) {
      expect(text).not.toContain(word);
    }
  });

  it('says a wet-season caution for an outdoor event in a wet month', () => {
    const risks = risksFor({ venueType: 'outdoor', eventDate: '2026-07-15' });
    expect(risks.some((risk) => risk.id === 'outdoor-wet-season')).toBe(true);
  });

  it('does not warn about weather for an indoor event', () => {
    const risks = risksFor({ venueType: 'indoor', eventDate: '2026-07-15' });
    expect(risks.some((risk) => risk.id === 'outdoor-wet-season')).toBe(false);
  });

  it('does not warn about weather for an outdoor event in a dry month', () => {
    const risks = risksFor({ venueType: 'outdoor', eventDate: '2026-01-15' });
    expect(risks.some((risk) => risk.id === 'outdoor-wet-season')).toBe(false);
  });

  it('remembers that the guest count is only an estimate', () => {
    const risks = risksFor({ guestCountIsEstimate: true });
    expect(risks.some((risk) => risk.id === 'guests-estimate')).toBe(true);
  });

  it('does not mention the guest count when it is confirmed', () => {
    const risks = risksFor({ guestCountIsEstimate: false });
    expect(risks.some((risk) => risk.id === 'guests-estimate')).toBe(false);
  });

  it('says a venue cannot be held when there is no date', () => {
    const risks = risksFor({ eventDate: null });
    expect(risks.some((risk) => risk.id === 'venue-unknown-date')).toBe(true);
  });

  it('is quiet about the venue when there is plenty of time', () => {
    const risks = risksFor({ eventDate: '2027-12-05' });
    expect(risks.some((risk) => risk.id === 'venue-late')).toBe(false);
  });

  it('flags a low vendor coverage when the date is close', () => {
    const risks = risksFor({ eventDate: '2026-11-25' });
    expect(risks.some((risk) => risk.id === 'coverage-low-soon')).toBe(true);
  });

  it('carries a budget warning through as a risk', () => {
    const risks = risksFor({ budgetMinor: 0 });
    expect(risks.some((risk) => risk.id === 'budget-no-budget')).toBe(true);
  });

  it('does not turn an informational budget note into a risk', () => {
    const risks = risksFor({ budgetMinor: 0 });
    expect(risks.some((risk) => risk.id === 'budget-venue-light')).toBe(false);
  });

  it('flags recorded quotes that cost more than the plan', () => {
    const risks = risksFor({ budgetMinor: 100_000 }, [
      {
        id: 'v1',
        category: 'caterer',
        name: 'Sharma Caterers',
        status: 'quoted',
        quotedMinor: 500_000,
        depositMinor: null,
        dueDate: null,
        phone: '',
        notes: '',
      },
    ]);
    expect(risks.some((risk) => risk.id === 'budget-quotes-over-budget')).toBe(true);
  });

  it('puts a low severity risk after a high one', () => {
    const risks = risksFor({ guestCountIsEstimate: true, dietary: ['vegan'] });
    const estimate = risks.findIndex((risk) => risk.id === 'guests-estimate');
    const diet = risks.findIndex((risk) => risk.id === 'dietary-unconfirmed');
    expect(diet).toBeLessThan(estimate);
  });

  it('gives every risk an area the user can filter on', () => {
    const areas = new Set(
      risksFor({ dietary: ['vegan'], access: ['wheelchair'] }).map((r) => r.area),
    );
    for (const area of areas) {
      expect([
        'budget',
        'timeline',
        'vendors',
        'catering',
        'guest-experience',
        'planning',
      ]).toContain(area);
    }
  });
});
