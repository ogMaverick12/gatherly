'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { Plan } from './plan';
import { readStoredPlan, writeStoredPlan } from './plan-storage';

/**
 * The plan store.
 *
 * The plan belongs to the browser: there is no server session and no
 * database. The store is a small external store (not a context) so that a
 * change to one vendor row does not re-render the whole workspace.
 *
 * Storage is a separate module; this file only owns the in-memory plan,
 * notifications and the React hooks.
 */

let currentPlan: Plan | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function emit(): void {
  for (const listener of listeners) listener();
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

/** Apply the optional preparation transform to one plan. */
function preparePlan(plan: Plan, prepare?: (plan: Plan) => Plan): Plan {
  return prepare ? prepare(plan) : plan;
}

/** Prepare a plan that is already in memory. */
function prepareCurrentPlan(prepare?: (plan: Plan) => Plan): void {
  if (!prepare || !currentPlan) return;
  const next = prepare(currentPlan);
  if (next === currentPlan) return;
  currentPlan = next;
  writeStoredPlan(next);
  emit();
}

/** Adopt a plan read from storage, or prepare the current one if there is none. */
function hydrateOnce(prepare?: (plan: Plan) => Plan): void {
  const stored = readStoredPlan();
  if (!stored) {
    prepareCurrentPlan(prepare);
    return;
  }
  const next = preparePlan(stored, prepare);
  currentPlan = next;
  if (next !== stored) writeStoredPlan(next);
  emit();
}

/**
 * Read the stored plan once, on the client. Safe to call repeatedly.
 *
 * Hydration happens inside an effect, after React has already subscribed to
 * the store, so it has to notify the subscribers itself. Without that
 * notification a page reload would leave the workspace showing "no plan"
 * even though the plan is sitting in local storage.
 *
 * @param prepare optional one-time transform applied before the first render
 * @returns the current plan after hydration and preparation
 */
export function hydratePlan(prepare?: (plan: Plan) => Plan): Plan | null {
  if (hydrated) {
    prepareCurrentPlan(prepare);
  } else {
    hydrated = true;
    hydrateOnce(prepare);
  }
  return currentPlan;
}

/**
 * The current plan, or null before a plan is created or hydrated.
 *
 * @returns the in-memory plan, without touching storage
 */
export function getPlan(): Plan | null {
  return currentPlan;
}

/**
 * Replace the current plan and persist it, or clear storage with null.
 *
 * @param plan the plan to store, or null to clear it
 */
export function setPlan(plan: Plan | null): void {
  currentPlan = plan;
  writeStoredPlan(plan);
  emit();
}

/**
 * Apply an updater to the current plan and persist the result.
 * Does nothing when no plan is loaded.
 *
 * @param updater pure function from the current plan to the next one
 */
function updatePlan(updater: (plan: Plan) => Plan): void {
  if (!currentPlan) return;
  const next = updater(currentPlan);
  currentPlan = { ...next, updatedAt: new Date().toISOString() };
  writeStoredPlan(currentPlan);
  emit();
}

/**
 * Remove the plan from memory and from local storage.
 */
function clearPlan(): void {
  setPlan(null);
}

/**
 * Subscribe a component to the plan store.
 *
 * @returns the current plan, or null when there is none
 */
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
