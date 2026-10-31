import type { Plan } from '@/lib/plan';
import type { BudgetAllocation } from '@/features/budget';
import type { CateringEstimate } from '@/features/catering';
import type { TimelineSummary } from '@/features/timeline';
import type { VendorCoverage } from '@/features/vendors';

/**
 * The risk register's public shapes.
 *
 * Keeping the types out of the rule module lets the guest-risk rules and the
 * register share them without an import cycle.
 */

export type RiskSeverity = 'low' | 'medium' | 'high';

type RiskArea = 'budget' | 'timeline' | 'vendors' | 'catering' | 'guest-experience' | 'planning';

/** One risk surfaced from the plan. */
export interface Risk {
  readonly id: string;
  readonly severity: RiskSeverity;
  readonly area: RiskArea;
  readonly title: string;
  readonly explanation: string;
  readonly mitigation: string;
}

/** The plan values the risk check reads. */
export interface RiskInputs {
  readonly plan: Plan;
  readonly budget: BudgetAllocation;
  readonly coverage: VendorCoverage;
  readonly timeline: TimelineSummary;
  readonly catering: CateringEstimate;
}
