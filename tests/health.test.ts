import { describe, expect, it } from 'vitest';
import { computeHealth } from '@/features/health/services';
import { computeBudget } from '@/features/budget/services';
import { computeVendorCoverage } from '@/features/vendors/services';
import {
  buildMilestoneLadder,
  mergeMilestoneState,
  summariseTimeline,
} from '@/features/timeline/services';
import { createPlan, type Intake } from '@/lib/plan';
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

function healthFor(patch: Partial<Intake> = {}) {
  const plan = createPlan({ ...BASE, ...patch }, new Date('2026-01-01T00:00:00.000Z'));
  const budget = computeBudget(plan);
  const allocation = computePlanView(plan, TODAY).allocationByCategory;
  const coverage = computeVendorCoverage(plan, allocation);
  const milestones = mergeMilestoneState(plan.milestones, buildMilestoneLadder(plan, TODAY));
  const timeline = summariseTimeline(milestones, '2026-11-25');
  return computeHealth({ plan, budget, coverage, timeline });
}

describe('computeHealth', () => {
  it('publishes five parts that add up to 100 per cent', () => {
    const health = healthFor();
    expect(health.parts).toHaveLength(5);
    const weight = health.parts.reduce((sum, part) => sum + part.weight, 0);
    expect(weight).toBe(100);
  });

  it('explains what it measured for every part', () => {
    for (const part of healthFor().parts) {
      expect(part.whatWasMeasured.length).toBeGreaterThan(0);
      expect(part.label.length).toBeGreaterThan(0);
    }
  });

  it('scores between 0 and 100 and names a band', () => {
    const health = healthFor();
    expect(health.score).toBeGreaterThanOrEqual(0);
    expect(health.score).toBeLessThanOrEqual(100);
    expect(['on_track', 'attention', 'at_risk']).toContain(health.band);
  });

  it('shows the formula', () => {
    expect(healthFor().formula).toContain('%');
  });

  it('is at risk when there is no budget at all', () => {
    const health = healthFor({ budgetMinor: 0 });
    expect(health.band).toBe('at_risk');
    expect(health.nextAction).not.toBeNull();
  });

  it('rewards ticking tasks off', () => {
    const done = healthFor();
    const withTasks = computeHealth({
      plan: {
        ...createPlan(BASE, new Date()),
        tasks: [{ id: 't1', title: 'Book the venue', done: true, area: 'vendors' }],
      },
      budget: computeBudget(createPlan(BASE, new Date())),
      coverage: computeVendorCoverage(createPlan(BASE, new Date()), {}),
      timeline: summariseTimeline(
        mergeMilestoneState([], buildMilestoneLadder(createPlan(BASE, new Date()), TODAY)),
        '2026-11-25',
      ),
    });
    const taskPart = (report: typeof done) =>
      report.parts.find((part) => part.id === 'tasks')?.score ?? 0;
    expect(taskPart(withTasks)).toBeGreaterThan(taskPart(done));
  });

  it('moves the score when a milestone is completed', () => {
    const plan = createPlan(BASE, new Date('2026-01-01T00:00:00.000Z'));
    const ladder = buildMilestoneLadder(plan, TODAY);
    const budget = computeBudget(plan);
    const allocation = computePlanView(plan, TODAY).allocationByCategory;
    const coverage = computeVendorCoverage(plan, allocation);

    const scoreWith = (done: number) => {
      const milestones = mergeMilestoneState(
        ladder.map((milestone, index) => ({
          id: milestone.id,
          title: milestone.title,
          date: milestone.date,
          offsetDays: milestone.offsetDays,
          done: index < done,
          owner: milestone.owner,
          whyItMatters: milestone.whyItMatters,
        })),
        ladder,
      );
      const timeline = summariseTimeline(milestones, TODAY);
      return computeHealth({ plan, budget, coverage, timeline }).score;
    };

    expect(scoreWith(1)).toBeGreaterThan(scoreWith(0));
  });

  it('does not call a step overdue before its date', () => {
    const plan = createPlan(BASE, new Date('2026-01-01T00:00:00.000Z'));
    const ladder = buildMilestoneLadder(plan, TODAY);
    const timeline = summariseTimeline(ladder, TODAY);
    expect(timeline.overdue).toBe(0);
  });
});
