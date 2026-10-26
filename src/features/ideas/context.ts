import type { CityTier, DietaryNeed, EventType, Priority } from '@/lib/plan';
import type { formatMinor } from '@/lib/money';

/**
 * Ideas engine - the deterministic "Basic mode".
 *
 * These are planning suggestions derived from the numbers already in the
 * plan. They are not model output and the app never labels them as such.
 * Every idea quotes the user's own figures so it reads as advice about
 * *their* event rather than generic filler.
 */

export interface IdeaContext {
  readonly guests: number;
  readonly eventType: EventType;
  readonly cityTier: CityTier;
  readonly priorities: readonly Priority[];
  readonly dietary: readonly DietaryNeed[];
  readonly month: number | null;
  readonly currency: PlanCurrency;
  readonly budgetMinor: number;
  readonly perGuestMinor: number;
}

export type PlanCurrency = Parameters<typeof formatMinor>[1];
