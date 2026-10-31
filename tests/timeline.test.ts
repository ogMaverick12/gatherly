import { describe, expect, it } from 'vitest';
import {
  buildMilestoneLadder,
  buildRunOfShow,
  mergeMilestoneState,
  summariseTimeline,
} from '@/features/timeline';
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

/** The day the plan is looked at. Fixed, so no test depends on the clock. */
const TODAY = '2026-10-22';

describe('buildMilestoneLadder', () => {
  it('works backwards from the event date', () => {
    const ladder = buildMilestoneLadder(planWith(), TODAY);
    const eventDay = ladder.find((milestone) => milestone.offsetDays === 0);
    expect(eventDay?.date).toBe('2026-12-05');

    const earlier = ladder.filter((milestone) => milestone.date !== null);
    const dates = earlier.map((milestone) => milestone.date as string);
    expect([...dates].sort()).toEqual(dates);
  });

  it('leaves dates empty when no date is set', () => {
    const ladder = buildMilestoneLadder(planWith({ eventDate: null }), TODAY);
    expect(ladder.length).toBeGreaterThan(0);
    expect(ladder.every((milestone) => milestone.date === null)).toBe(true);
  });

  it('adds lead time for a larger guest list', () => {
    const small = buildMilestoneLadder(planWith({ guests: 50, eventDate: '2027-12-05' }), TODAY);
    const large = buildMilestoneLadder(planWith({ guests: 320, eventDate: '2027-12-05' }), TODAY);
    const smallStart = small[0]?.offsetDays ?? 0;
    const largeStart = large[0]?.offsetDays ?? 0;
    expect(largeStart).toBeLessThan(smallStart);
  });

  it('never schedules a step before the day the plan is looked at', () => {
    const ladder = buildMilestoneLadder(planWith(), TODAY);
    for (const milestone of ladder) {
      if (milestone.date === null) continue;
      expect(milestone.date >= TODAY).toBe(true);
    }
  });

  it('moves the steps that can no longer be done on time to today', () => {
    const ladder = buildMilestoneLadder(planWith(), TODAY);
    const first = ladder[0];
    expect(first?.date).toBe(TODAY);
  });

  it('keeps the steps that are still in the future where they were', () => {
    const ladder = buildMilestoneLadder(planWith(), TODAY);
    const last = ladder[ladder.length - 1];
    expect(Math.abs(last?.offsetDays ?? 1)).toBe(0);
    expect(last?.date).toBe('2026-12-05');
  });

  it('drops the venue hold once the venue is booked', () => {
    const plan = planWith();
    const withVenue = {
      ...plan,
      vendors: [
        {
          id: 'v1',
          category: 'venue' as const,
          name: 'Hall',
          status: 'booked' as const,
          quotedMinor: null,
          depositMinor: null,
          dueDate: null,
          phone: '',
          notes: '',
        },
      ],
    };
    const booked = buildMilestoneLadder(withVenue, TODAY);
    const open = buildMilestoneLadder(plan, TODAY);
    expect(booked.length).toBeLessThan(open.length);
  });

  it('explains why each milestone matters', () => {
    for (const milestone of buildMilestoneLadder(planWith(), TODAY)) {
      expect(milestone.whyItMatters.length).toBeGreaterThan(0);
    }
  });
});

describe('mergeMilestoneState', () => {
  it('keeps the completion state the user has set', () => {
    const ladder = buildMilestoneLadder(planWith(), TODAY);
    const first = ladder[0];
    expect(first).toBeDefined();
    if (!first) return;

    const merged = mergeMilestoneState(
      [
        {
          id: first.id,
          title: first.title,
          date: first.date,
          offsetDays: first.offsetDays,
          done: true,
          owner: first.owner,
          whyItMatters: first.whyItMatters,
        },
      ],
      ladder,
    );

    expect(merged.find((milestone) => milestone.id === first.id)?.done).toBe(true);
    expect(merged.find((milestone) => milestone.id === first.id)?.critical).toBe(first.critical);
  });
});

describe('summariseTimeline', () => {
  it('counts done, overdue and the next milestone', () => {
    const ladder = buildMilestoneLadder(planWith(), TODAY);
    const today = '2026-11-25';
    const summary = summariseTimeline(ladder, today);

    expect(summary.total).toBe(ladder.length);
    expect(summary.done).toBe(0);
    expect(summary.overdue).toBeGreaterThan(0);
    expect(summary.nextUp).not.toBeNull();
  });

  it('counts the days to the event', () => {
    const ladder = buildMilestoneLadder(planWith(), TODAY);
    const summary = summariseTimeline(ladder, '2026-11-25');
    expect(summary.daysToEvent).toBe(10);
  });

  it('reports no days to the event when the date is unknown', () => {
    const ladder = buildMilestoneLadder(planWith({ eventDate: null }), TODAY);
    expect(summariseTimeline(ladder, '2026-11-25').daysToEvent).toBeNull();
  });
});

describe('buildRunOfShow', () => {
  it('produces an ordered day for the event type', () => {
    const steps = buildRunOfShow(planWith());
    expect(steps.length).toBeGreaterThan(0);
    const times = steps.map((step) => step.time);
    expect([...times].sort()).toEqual(times);
  });

  it('names an owner and a location for every step', () => {
    for (const step of buildRunOfShow(planWith({ eventType: 'community' }))) {
      expect(step.owner.length).toBeGreaterThan(0);
      expect(step.location.length).toBeGreaterThan(0);
    }
  });
});
