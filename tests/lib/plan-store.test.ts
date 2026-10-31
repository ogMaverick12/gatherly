import { act, renderHook } from '@testing-library/react';
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

/** Read the one plan key without depending on a storage-exported constant. */
function storedRaw(): string | null {
  const key = window.localStorage.key(0);
  return key ? window.localStorage.getItem(key) : null;
}

/** Replace the stored value after a plan has created the key. */
function overwriteStored(raw: string): void {
  const key = window.localStorage.key(0);
  if (!key) throw new Error('expected a stored plan key');
  window.localStorage.setItem(key, raw);
}

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
    const raw = storedRaw();
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw ?? '').intake.guests).toBe(40);
  });

  it('reads a stored plan back after a reload', async () => {
    store.setPlan(createPlan(BASE, new Date()));

    const reloaded = await import('@/lib/plan-store');
    expect(reloaded.hydratePlan()?.intake.guests).toBe(40);
  });

  it('applies a one-time prepare transform before returning the stored plan', () => {
    const plan = createPlan(BASE, new Date('2026-01-01T00:00:00.000Z'));
    store.setPlan(plan);
    const prepare = vi.fn((stored: typeof plan) => ({
      ...stored,
      tasks: [{ id: 't1', title: 'Check the venue', done: false, area: 'vendors' as const }],
    }));

    const hydrated = store.hydratePlan(prepare);

    expect(prepare).toHaveBeenCalledOnce();
    expect(hydrated?.tasks).toHaveLength(1);
    expect(JSON.parse(storedRaw() ?? '').tasks).toHaveLength(1);
  });

  it('discards a stored plan that does not match the schema', async () => {
    store.setPlan(createPlan(BASE, new Date()));
    overwriteStored('{"not":"a plan"}');
    vi.resetModules();
    const reloaded = await import('@/lib/plan-store');

    expect(reloaded.hydratePlan()).toBeNull();
    expect(storedRaw()).toBeNull();
  });

  it('discards a stored plan with an unknown version', async () => {
    store.setPlan(createPlan(BASE, new Date()));
    const plan = { ...createPlan(BASE, new Date()), version: 99 };
    overwriteStored(JSON.stringify(plan));
    vi.resetModules();
    const reloaded = await import('@/lib/plan-store');

    expect(reloaded.hydratePlan()).toBeNull();
  });

  it('survives unparsable stored data', async () => {
    store.setPlan(createPlan(BASE, new Date()));
    overwriteStored('not json at all');
    vi.resetModules();
    const reloaded = await import('@/lib/plan-store');

    expect(() => reloaded.hydratePlan()).not.toThrow();
    expect(reloaded.hydratePlan()).toBeNull();
  });

  it('applies an updater and stamps the update time', () => {
    const plan = createPlan(BASE, new Date('2026-01-01T00:00:00.000Z'));
    store.setPlan(plan);
    const { result } = renderHook(() => store.usePlanActions());

    act(() => {
      result.current.update((current) => ({
        ...current,
        tasks: [{ id: 't1', title: 'Book the venue', done: false, area: 'vendors' }],
      }));
    });

    expect(store.getPlan()?.tasks).toHaveLength(1);
    expect(store.getPlan()?.updatedAt).not.toBe(plan.updatedAt);
  });

  it('ignores an update when there is no plan', () => {
    const { result } = renderHook(() => store.usePlanActions());

    expect(() => {
      act(() => {
        result.current.update((current) => current);
      });
    }).not.toThrow();
    expect(store.getPlan()).toBeNull();
  });

  it('clears the plan from memory and storage', () => {
    store.setPlan(createPlan(BASE, new Date()));
    const { result } = renderHook(() => store.usePlanActions());

    act(() => {
      result.current.clear();
    });

    expect(store.getPlan()).toBeNull();
    expect(storedRaw()).toBeNull();
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
