import { describe, expect, it } from 'vitest';
import { computePlanView } from '@/features/workspace';
import { makePlan } from './factories';

describe('the derived plan view', () => {
  it('handles a plan whose date has not been decided', () => {
    const view = computePlanView(makePlan({ eventDate: null }), '2026-10-22');
    expect(view.snapshot.eventDate).toBeNull();
    expect(view.timeline.daysToEvent).toBeNull();
  });

  it('handles a plan with no guests without dividing by zero', () => {
    const view = computePlanView(makePlan({ guests: 0 }), '2026-10-22');
    expect(view.snapshot.perGuestMinor).toBe(0);
    expect(view.ideas).toBeDefined();
  });
});
