import type { Plan } from '@/lib/plan';
import type { BudgetAllocation } from '@/features/budget/services';
import type { VendorCoverage } from '@/features/vendors/services';
import type { TimelineSummary } from '@/features/timeline/services';

/**
 * The shape of a health report.
 *
 * A report is five named parts with published weights, so the number on the
 * screen can always be traced back to what was measured.
 */

export type HealthBand = 'on_track' | 'attention' | 'at_risk';

export interface HealthPart {
  readonly id: string;
  readonly label: string;
  readonly score: number;
  readonly weight: number;
  readonly whatWasMeasured: string;
  readonly nextActions: readonly string[];
}

export interface HealthReport {
  readonly score: number;
  readonly band: HealthBand;
  readonly parts: readonly HealthPart[];
  readonly formula: string;
  readonly nextAction: string | null;
}

export interface HealthInputs {
  readonly plan: Plan;
  readonly budget: BudgetAllocation;
  readonly coverage: VendorCoverage;
  readonly timeline: TimelineSummary;
}
