import { budgetPart, guestPart, taskPart, timelinePart, vendorPart } from './parts';
import type { HealthBand, HealthInputs, HealthPart, HealthReport } from './types';

/**
 * Plan health.
 *
 * Five explainable parts, each with a published weight, an explanation of
 * what was measured and a concrete next action. This is a planning
 * heuristic - the app says so, and always shows its inputs.
 */

/**
 * Scores the plan out of 100 and picks the first thing worth doing.
 * @param inputs the plan plus the budget, vendor and timeline results already computed for it
 * @returns a score 0-100, its band, the five weighted parts and their formula
 */
export function computeHealth(inputs: HealthInputs): HealthReport {
  const parts: HealthPart[] = [
    budgetPart(inputs.budget),
    timelinePart(inputs.timeline),
    vendorPart(inputs.coverage),
    taskPart(inputs.plan),
    guestPart(inputs.plan),
  ];

  const total = parts.reduce((sum, part) => sum + part.score * (part.weight / 100), 0);
  const score = Math.round(total);
  const band: HealthBand = score >= 75 ? 'on_track' : score >= 50 ? 'attention' : 'at_risk';

  const nextAction =
    parts
      .slice()
      .sort((a, b) => a.score * a.weight - b.score * b.weight)
      .flatMap((part) => part.nextActions)[0] ?? null;

  return {
    score,
    band,
    parts,
    formula: parts.map((part) => `${part.label} ${part.weight}%`).join(' + '),
    nextAction,
  };
}
