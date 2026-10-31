import type { HealthBand } from './health-band';
import type { Plan } from './plan';

/**
 * The snapshot: the one object an answer is written from.
 *
 * It holds the numbers the other engines computed for this plan. It is a
 * shared type rather than a feature type so request validation can describe a
 * snapshot without importing a feature slice.
 */

export interface PlanSnapshot {
  readonly eventType: Plan['intake']['eventType'];
  readonly eventDate: string | null;
  readonly guests: number;
  readonly cityTier: Plan['intake']['cityTier'];
  readonly currency: Plan['intake']['currency'];
  readonly budgetMinor: number;
  readonly contingencyMinor: number;
  readonly perGuestMinor: number;
  readonly categories: readonly {
    readonly label: string;
    readonly amountMinor: number;
    readonly sharePercent: number;
  }[];
  readonly healthScore: number;
  readonly healthBand: HealthBand;
  readonly nextMilestone: string | null;
  readonly nextMilestoneDate: string | null;
  readonly overdueCount: number;
  readonly milestonesDone: number;
  readonly milestonesTotal: number;
  readonly vendorCoveragePercent: number;
  readonly outstandingVendors: readonly string[];
  readonly plates: number;
  readonly drinks: number;
  readonly dietary: readonly string[];
  readonly tasksDone: number;
  readonly tasksTotal: number;
  readonly topRisks: readonly string[];
}
