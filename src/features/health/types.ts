import type { Plan } from '@/lib/plan';
import type { HealthBand } from '@/lib/health-band';
import type { BudgetAllocation } from '@/features/budget';
import type { VendorCoverage } from '@/features/vendors';
import type { TimelineSummary } from '@/features/timeline';

export type { HealthBand } from '@/lib/health-band';

/**
 * The shape of a health report.
 *
 * A report is five named parts with published weights, so the number on the
 * screen can always be traced back to what was measured.
 */

export interface HealthPart {
  readonly id: string;
  readonly label: string;
  readonly score: number;
  readonly weight: number;
  readonly whatWasMeasured: string;
  readonly nextActions: readonly string[];
}

/** The plan's health score and the reasons behind it. */
export interface HealthReport {
  readonly score: number;
  readonly band: HealthBand;
  readonly parts: readonly HealthPart[];
  readonly formula: string;
  readonly nextAction: string | null;
}

/** The plan values the health score is calculated from. */
export interface HealthInputs {
  readonly plan: Plan;
  readonly budget: BudgetAllocation;
  readonly coverage: VendorCoverage;
  readonly timeline: TimelineSummary;
}
