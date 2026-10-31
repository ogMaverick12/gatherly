import { ACCESS_LABELS } from '@/lib/plan';
import type { Risk, RiskInputs } from './types';

/**
 * Guest-facing risks: dietary confirmation, access needs and an estimate that
 * is still moving. They share one rule: say exactly which need is at stake.
 */

/** A dietary need nobody has confirmed with the caterer in writing. */
export function dietaryRisk(inputs: RiskInputs): Risk | null {
  const unconfirmed = inputs.catering.dietary.filter((need) => !need.confirmed);
  if (unconfirmed.length === 0) return null;
  const labels = unconfirmed.map((need) => need.label).join(', ');
  return {
    id: 'dietary-unconfirmed',
    severity: 'high',
    area: 'catering',
    title: 'Dietary needs are not confirmed with a caterer',
    explanation: `${unconfirmed.length} dietary need${unconfirmed.length === 1 ? ' is' : 's are'} recorded but not yet confirmed in writing: ${labels}.`,
    mitigation: 'Send the list to the caterer and keep their written reply.',
  };
}

/** An access need the checklist never turns into work, grouped into one risk. */
export function accessRisks(inputs: RiskInputs): Risk[] {
  const missing = inputs.plan.intake.access.filter((need) => {
    const key = (need.split(' ')[0] ?? '').toLowerCase();
    return !inputs.plan.tasks.some(
      (task) => task.area === 'accessibility' && task.title.toLowerCase().includes(key),
    );
  });
  if (missing.length === 0) return [];

  const labels = missing.map((need) => ACCESS_LABELS[need]);
  if (missing.length === 1) {
    return [
      {
        id: `access-${missing[0]}`,
        severity: 'medium',
        area: 'guest-experience',
        title: 'An access need has no task behind it',
        explanation: `"${labels[0]}" is recorded, but nothing on the checklist is going to make it happen.`,
        mitigation: 'Add a task and ask the venue in writing, not on the day.',
      },
    ];
  }

  return [
    {
      id: 'access-needs',
      severity: 'medium',
      area: 'guest-experience',
      title: `${missing.length} access needs have no task behind them`,
      explanation: `${labels.join(', ')} are recorded, but nothing on the checklist is going to make them happen.`,
      mitigation: 'Add a task for each need and ask the venue in writing, not on the day.',
    },
  ];
}

/** An estimate is not a number to order food against. */
export function estimateRisk(inputs: RiskInputs): Risk | null {
  if (!inputs.plan.intake.guestCountIsEstimate) return null;
  return {
    id: 'guests-estimate',
    severity: 'low',
    area: 'planning',
    title: 'The guest count is still an estimate',
    explanation: 'Food, seating and print all move when the number moves.',
    mitigation: 'Re-run the food estimate once the list settles, and keep an 8% plate buffer.',
  };
}
