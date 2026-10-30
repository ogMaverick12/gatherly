import { describe, expect, it } from 'vitest';
import {
  buildBasicAnswer,
  buildSnapshot,
  classifyIntent,
  renderSnapshotForModel,
  topShare,
} from '@/features/assistant/services';
import { computeBudget } from '@/features/budget/services';
import { computeVendorCoverage } from '@/features/vendors/services';
import { computeCatering } from '@/features/catering/services';
import { computeHealth } from '@/features/health/services';
import { computeRisks } from '@/features/risks/services';
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
  dietary: ['vegetarian'],
  access: [],
  language: 'en',
  packs: [],
  venueType: 'indoor',
  guestCountIsEstimate: false,
  notes: '',
};

function snapshot() {
  const plan = createPlan(BASE, new Date('2026-01-01T00:00:00.000Z'));
  const budget = computeBudget(plan);
  const allocation = computePlanView(plan, TODAY).allocationByCategory;
  const coverage = computeVendorCoverage(plan, allocation);
  const milestones = mergeMilestoneState(plan.milestones, buildMilestoneLadder(plan, TODAY));
  const timeline = summariseTimeline(milestones, '2026-11-25');
  const catering = computeCatering(plan);
  const health = computeHealth({ plan, budget, coverage, timeline });
  const risks = computeRisks({ plan, budget, coverage, timeline, catering });
  return buildSnapshot(plan, budget, coverage, timeline, health, catering, risks);
}

describe('classifyIntent', () => {
  it('recognises the questions people actually ask', () => {
    expect(classifyIntent('how much money is the food?')).toBe('catering');
    expect(classifyIntent('what should I do next')).toBe('next-step');
    expect(classifyIntent('who is my photographer')).toBe('vendors');
    expect(classifyIntent('is the budget ok')).toBe('budget');
    expect(classifyIntent('what is the schedule')).toBe('timeline');
  });

  it('falls back to general for anything else', () => {
    expect(classifyIntent('hello there')).toBe('general');
  });

  it('ignores case', () => {
    expect(classifyIntent('BUDGET please')).toBe('budget');
  });
});

describe('buildBasicAnswer', () => {
  it('answers with the plan numbers', () => {
    const answer = buildBasicAnswer('budget', snapshot());
    expect(answer).toContain('100 guests');
    expect(answer.length).toBeGreaterThan(20);
  });

  it('answers the next-step question with the next milestone', () => {
    const answer = buildBasicAnswer('next-step', snapshot());
    expect(answer.length).toBeGreaterThan(0);
  });

  it('answers a catering question with the plate count', () => {
    const answer = buildBasicAnswer('catering', snapshot());
    expect(answer).toContain('plates');
  });

  it('always answers something for a general question', () => {
    const answer = buildBasicAnswer('general', snapshot());
    expect(answer).toContain('Plan health');
  });
});

describe('buildBasicAnswer detail', () => {
  it('names the vendors that are still open', () => {
    const answer = buildBasicAnswer('vendors', {
      ...snapshot(),
      outstandingVendors: ['Sharma Caterers'],
    });
    expect(answer).toContain('Sharma Caterers');
  });

  it('says nothing is outstanding when every vendor is booked', () => {
    const answer = buildBasicAnswer('vendors', { ...snapshot(), outstandingVendors: [] });
    expect(answer).toContain('Nothing is outstanding');
  });

  it('asks about dietary needs when none are recorded', () => {
    const answer = buildBasicAnswer('catering', { ...snapshot(), dietary: [] });
    expect(answer).toContain('ask the caterer anyway');
  });

  it('points at the next milestone when nothing is flagged', () => {
    const answer = buildBasicAnswer('next-step', {
      ...snapshot(),
      topRisks: [],
      nextMilestone: 'Book the venue',
    });
    expect(answer).toContain('Book the venue');
  });

  it('asks for a date and a budget when the plan is empty', () => {
    const answer = buildBasicAnswer('next-step', {
      ...snapshot(),
      topRisks: [],
      nextMilestone: null,
    });
    expect(answer).toContain('Add a date and a budget');
  });
});

describe('renderSnapshotForModel', () => {
  it('renders a bounded, machine-readable summary', () => {
    const summary = renderSnapshotForModel(snapshot());
    expect(summary).toContain('guests=100');
    expect(summary).toContain('currency=INR');
    expect(summary).not.toContain('<user_input>');
  });
});

describe('topShare', () => {
  it('returns the share of the largest line', () => {
    expect(topShare(snapshot())).toBeGreaterThan(0);
  });
});
