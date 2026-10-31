/**
 * The plan's browser storage.
 *
 * Local storage is untrusted: every stored value is parsed with the plan
 * schema, and a value that does not match is discarded rather than restored.
 *
 * The last raw value and its parsed plan are cached because
 * `useSyncExternalStore` may read the store several times in one render.
 */

import { PlanSchema, type Plan } from './plan';

const PLAN_STORAGE_KEY = 'gatherly:plan:v1';

let lastRaw: string | null = null;
let lastStored: Plan | null = null;

/** Clear the read-through cache in one place. */
function resetCache(): void {
  lastRaw = null;
  lastStored = null;
}

/** Parse and validate one raw stored value. Throws only on invalid JSON. */
function validateStoredPlan(raw: string): Plan | null {
  const parsed = PlanSchema.safeParse(JSON.parse(raw));
  return parsed.success ? parsed.data : null;
}

/**
 * Read the stored plan, using the cache when the raw value is unchanged.
 *
 * @returns the validated plan, or null when there is no usable stored plan
 */
export function readStoredPlan(): Plan | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PLAN_STORAGE_KEY);
    if (raw === lastRaw) return lastStored;
    if (!raw) {
      resetCache();
      return null;
    }
    const plan = validateStoredPlan(raw);
    if (!plan) {
      window.localStorage.removeItem(PLAN_STORAGE_KEY);
      resetCache();
      return null;
    }
    lastRaw = raw;
    lastStored = plan;
    return plan;
  } catch {
    return null;
  }
}

/**
 * Write the plan, or clear storage when it is null.
 *
 * @param plan the plan to persist, or null to remove it
 */
export function writeStoredPlan(plan: Plan | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (plan === null) {
      window.localStorage.removeItem(PLAN_STORAGE_KEY);
      resetCache();
      return;
    }
    const raw = JSON.stringify(plan);
    window.localStorage.setItem(PLAN_STORAGE_KEY, raw);
    lastRaw = raw;
    lastStored = plan;
  } catch {
    // Storage may be full or unavailable. The in-memory plan still works.
  }
}
