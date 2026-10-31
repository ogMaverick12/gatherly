import { createPlan, type Intake, type Plan, type Vendor } from '@/lib/plan';
import type { PlanSnapshot } from '@/features/assistant';
import { computePlanView } from '@/features/workspace';

/** A valid intake every builder starts from. */
export const TEST_INTAKE: Intake = {
  eventType: 'wedding',
  eventDate: '2026-12-05',
  guests: 120,
  cityTier: 'tier2',
  currency: 'INR',
  budgetMinor: 10_000_000,
  priorities: ['food', 'photography'],
  cultureNote: '',
  dietary: ['vegetarian'],
  access: ['wheelchair'],
  language: 'en',
  packs: [],
  venueType: 'mixed',
  guestCountIsEstimate: false,
  notes: '',
};

/** The fixed clock every builder uses unless a test supplies another. */
const FIXED_NOW = new Date('2026-01-01T00:00:00.000Z');

/**
 * Build a plan from the shared intake, with an optional patch and clock.
 *
 * @param patch intake fields to override
 * @param now the creation timestamp
 */
export function makePlan(patch: Partial<Intake> = {}, now: Date = FIXED_NOW): Plan {
  return createPlan({ ...TEST_INTAKE, ...patch }, now);
}

/**
 * Build a vendor with the defaults the vendor tests share.
 *
 * @param patch vendor fields to override
 */
export function makeVendor(patch: Partial<Vendor> = {}): Vendor {
  return {
    id: 'v1',
    category: 'caterer',
    name: 'Sharma Caterers',
    status: 'to_contact',
    quotedMinor: null,
    depositMinor: null,
    dueDate: null,
    phone: '',
    notes: '',
    ...patch,
  };
}

/**
 * Build a complete assistant snapshot with an optional patch.
 *
 * @param patch snapshot fields to override
 */
export function makeSnapshot(patch: Partial<PlanSnapshot> = {}): PlanSnapshot {
  return { ...computePlanView(makePlan(), '2026-11-25').snapshot, ...patch };
}

/**
 * Type a deliberately malformed value for one call.
 *
 * Use this only where a test is proving that a schema or parser rejects bad
 * input; the helper keeps the unsafe cast in one visible place.
 *
 * @param value the malformed value the test wants to pass
 */
export function asInvalid(value: unknown): never {
  return value as never;
}
