import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPlan, type Intake } from '@/lib/plan';
import type * as PlanStoreModule from '@/lib/plan-store';

const BASE: Intake = {
  eventType: 'birthday',
  eventDate: '2026-11-01',
  guests: 40,
  cityTier: 'tier1',
  currency: 'USD',
  budgetMinor: 500_000,
  priorities: ['food'],
  cultureNote: '',
  dietary: [],
  access: [],
  language: 'en',
  packs: [],
  venueType: 'indoor',
  guestCountIsEstimate: false,
  notes: '',
};

type StoreModule = typeof PlanStoreModule;

let store: StoreModule;

beforeEach(async () => {
  vi.resetModules();
  store = await import('@/lib/plan-store');
  window.localStorage.clear();
});

describe('the plan store', () => {
  it('starts empty', () => {
    expect(store.getPlan()).toBeNull();
    expect(store.hydratePlan()).toBeNull();
  });

  it('stores a plan in memory and in local storage', () => {
    const plan = createPlan(BASE, new Date());
    store.setPlan(plan);

    expect(store.getPlan()?.id).toBe(plan.id);
    const raw = window.localStorage.getItem(store.PLAN_STORAGE_KEY);
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).intake.guests).toBe(40);
  });

  it('reads a stored plan back after a reload', async () => {
    const plan = createPlan(BASE, new Date());
    window.localStorage.setItem(store.PLAN_STORAGE_KEY, JSON.stringify(plan));

    const reloaded = await import('@/lib/plan-store');
    expect(reloaded.hydratePlan()?.intake.guests).toBe(40);
  });

  it('applies a one-time prepare transform before returning the stored plan', () => {
    const plan = createPlan(BASE, new Date('2026-01-01T00:00:00.000Z'));
    window.localStorage.setItem(store.PLAN_STORAGE_KEY, JSON.stringify(plan));
    const prepare = vi.fn((stored: typeof plan) => ({
      ...stored,
      tasks: [{ id: 't1', title: 'Check the venue', done: false, area: 'vendors' as const }],
    }));

    const hydrated = store.hydratePlan(prepare);

    expect(prepare).toHaveBeenCalledOnce();
    expect(hydrated?.tasks).toHaveLength(1);
    expect(
      JSON.parse(window.localStorage.getItem(store.PLAN_STORAGE_KEY) as string).tasks,
    ).toHaveLength(1);
  });

  it('discards a stored plan that does not match the schema', () => {
    window.localStorage.setItem(store.PLAN_STORAGE_KEY, '{"not":"a plan"}');
    expect(store.hydratePlan()).toBeNull();
    expect(window.localStorage.getItem(store.PLAN_STORAGE_KEY)).toBeNull();
  });

  it('discards a stored plan with an unknown version', () => {
    const plan = { ...createPlan(BASE, new Date()), version: 99 };
    window.localStorage.setItem(store.PLAN_STORAGE_KEY, JSON.stringify(plan));
    expect(store.hydratePlan()).toBeNull();
  });

  it('survives unparsable stored data', () => {
    window.localStorage.setItem(store.PLAN_STORAGE_KEY, 'not json at all');
    expect(() => store.hydratePlan()).not.toThrow();
    expect(store.hydratePlan()).toBeNull();
  });

  it('applies an updater and stamps the update time', () => {
    const plan = createPlan(BASE, new Date('2026-01-01T00:00:00.000Z'));
    store.setPlan(plan);

    store.updatePlan((current) => ({
      ...current,
      tasks: [{ id: 't1', title: 'Book the venue', done: false, area: 'vendors' }],
    }));

    expect(store.getPlan()?.tasks).toHaveLength(1);
    expect(store.getPlan()?.updatedAt).not.toBe(plan.updatedAt);
  });

  it('ignores an update when there is no plan', () => {
    expect(() => store.updatePlan((current) => current)).not.toThrow();
    expect(store.getPlan()).toBeNull();
  });

  it('clears the plan from memory and storage', () => {
    store.setPlan(createPlan(BASE, new Date()));
    store.clearPlan();
    expect(store.getPlan()).toBeNull();
    expect(window.localStorage.getItem(store.PLAN_STORAGE_KEY)).toBeNull();
  });

  it('survives a storage write failure', () => {
    const original = window.localStorage.setItem;
    window.localStorage.setItem = () => {
      throw new Error('quota exceeded');
    };
    try {
      expect(() => store.setPlan(createPlan(BASE, new Date()))).not.toThrow();
      expect(store.getPlan()).not.toBeNull();
    } finally {
      window.localStorage.setItem = original;
    }
  });
});
