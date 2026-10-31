import { describe, expect, it } from 'vitest';
import { buildBasicAnswer, renderSnapshotForModel, topShare } from '@/features/assistant';
import { makeSnapshot } from '@tests/support/factories';

describe('the budget answer', () => {
  it('leaves out the category and health notes when neither applies', () => {
    const answer = buildBasicAnswer(
      'budget',
      makeSnapshot({ categories: [], healthBand: 'on_track' }),
    );

    expect(answer).toContain('Your budget is');
    expect(answer).not.toContain('largest lines');
    expect(answer).not.toContain('The Budget tab');
  });
});

describe('the timeline answer', () => {
  it('names the next milestone date and counts plural overdue items', () => {
    const answer = buildBasicAnswer(
      'timeline',
      makeSnapshot({
        nextMilestone: 'Book the venue',
        nextMilestoneDate: '2026-11-30',
        overdueCount: 2,
        milestonesDone: 3,
        milestonesTotal: 10,
      }),
    );

    expect(answer).toContain('"Book the venue" (2026-11-30)');
    expect(answer).toContain('2 milestones are already overdue');
  });

  it('uses the singular when one item is overdue and no date is set', () => {
    const answer = buildBasicAnswer(
      'timeline',
      makeSnapshot({
        nextMilestone: 'Book the venue',
        nextMilestoneDate: null,
        overdueCount: 1,
      }),
    );

    expect(answer).toContain('"Book the venue".');
    expect(answer).toContain('1 milestone is already overdue');
    expect(answer).not.toContain('(null)');
  });

  it('does not call an on-schedule plan overdue', () => {
    const answer = buildBasicAnswer('timeline', makeSnapshot({ overdueCount: 0 }));

    expect(answer).toContain('The next milestone is');
    expect(answer).not.toContain('already overdue');
  });

  it('explains what unlocks the timeline when there is no next milestone', () => {
    const answer = buildBasicAnswer('timeline', makeSnapshot({ nextMilestone: null }));

    expect(answer).toBe(
      'Set the event date and the Timeline tab will build a backwards plan with the dates attached.',
    );
  });
});

describe('the model snapshot', () => {
  it('marks absent optional values instead of embedding blanks', () => {
    const summary = renderSnapshotForModel(
      makeSnapshot({ eventDate: null, nextMilestone: null, dietary: [] }),
    );

    expect(summary).toContain('event_date=not set');
    expect(summary).toContain('next_milestone=none');
    expect(summary).toContain('dietary=none recorded');
  });
});

describe('topShare', () => {
  it('returns zero when no category has money', () => {
    expect(topShare(makeSnapshot({ categories: [] }))).toBe(0);
  });
});
