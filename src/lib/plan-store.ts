'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { PlanSchema, type Plan } from './plan';

/**
 * The plan store.
 *
 * The plan belongs to the browser: there is no server session and no
 * database. The store is a small external store (not a context) so that a
 * change to one vendor row does not re-render the whole workspace.
 *
 * Local storage is treated as untrusted: it is parsed with the plan schema
 * and discarded if it does not match, so a corrupted or outdated entry can
 * never crash the app.
 */

export const PLAN_STORAGE_KEY = 'gatherly:plan:v1';

let currentPlan: Plan | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
}

function readStoredPlan(): Plan | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PLAN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = PlanSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      window.localStorage.removeItem(PLAN_STORAGE_KEY);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function writeStoredPlan(plan: Plan | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (plan === null) {
      window.localStorage.removeItem(PLAN_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // Storage may be full or unavailable. The in-memory plan still works.
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Plan | null {
  return currentPlan;
}

function getServerSnapshot(): Plan | null {
  return null;
}

/**
 * Read the stored plan once, on the client. Safe to call repeatedly.
 *
 * Hydration happens inside an effect, after React has already subscribed to
 * the store, so it has to notify the subscribers itself. Without that
 * notification a page reload would leave the workspace showing "no plan"
 * even though the plan is sitting in local storage.
 */
export function hydratePlan(): Plan | null {
  if (hydrated) return currentPlan;
  hydrated = true;
  const stored = readStoredPlan();
  if (stored) {
    currentPlan = stored;
    emit();
  }
  return currentPlan;
}

export function getPlan(): Plan | null {
  return currentPlan;
}

export function setPlan(plan: Plan | null): void {
  currentPlan = plan;
  writeStoredPlan(plan);
  emit();
}

export function updatePlan(updater: (plan: Plan) => Plan): void {
  if (!currentPlan) return;
  const next = updater(currentPlan);
  currentPlan = { ...next, updatedAt: new Date().toISOString() };
  writeStoredPlan(currentPlan);
  emit();
}

export function clearPlan(): void {
  setPlan(null);
}

export function usePlan(): Plan | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Convenience hook: a stable updater that works with the external store. */
export function usePlanActions(): {
  update: (updater: (plan: Plan) => Plan) => void;
  replace: (plan: Plan | null) => void;
  clear: () => void;
} {
  const update = useCallback((updater: (plan: Plan) => Plan) => updatePlan(updater), []);
  const replace = useCallback((plan: Plan | null) => setPlan(plan), []);
  const clear = useCallback(() => clearPlan(), []);
  return { update, replace, clear };
}
