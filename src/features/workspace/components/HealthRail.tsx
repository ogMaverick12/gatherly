'use client';

import { useAccessibility } from '@/features/accessibility/provider';
import { CelebrationDot, HealthRing } from './HealthRing';
import type { PlanView } from '@/lib/plan-view';
import { formatMinor } from '@/lib/money';
import { formatDateOnly } from '@/lib/dates';
import type { HealthBand } from '@/features/health/services';

const BAND_LABEL: Record<HealthBand, string> = {
  on_track: 'On track',
  attention: 'Worth attention',
  at_risk: 'At risk',
};

export function HealthRail({ view }: { view: PlanView }) {
  const { dictionary } = useAccessibility();
  const { health, plan, budget, timeline } = view;
  const currency = plan.intake.currency;

  return (
    <div className="rounded-card border border-line bg-raised p-5 shadow-card">
      <div className="flex items-center gap-4">
        <HealthRing
          score={health.score}
          band={health.band}
          size={104}
          label={dictionary.workspace.health}
        />
        <div>
          <h2 className="font-display text-title-lg">{dictionary.workspace.health}</h2>
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink">
            <CelebrationDot
              status={
                health.band === 'on_track'
                  ? 'done'
                  : health.band === 'attention'
                    ? 'waiting'
                    : 'late'
              }
            />
            {BAND_LABEL[health.band]}
          </p>
          <p className="mt-1 text-xs text-ink-muted">{dictionary.workspace.healthExplainer}</p>
        </div>
      </div>

      {health.nextAction ? (
        <div className="mt-5 rounded-card border border-line bg-paper p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
            {dictionary.workspace.nextUp}
          </h3>
          <p className="mt-1.5 text-sm text-ink">{health.nextAction}</p>
        </div>
      ) : null}

      <dl className="mt-5 space-y-2.5 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-muted">{dictionary.workspace.guests}</dt>
          <dd className="font-medium">{plan.intake.guests}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-muted">{dictionary.workspace.date}</dt>
          <dd className="font-medium">
            {plan.intake.eventDate
              ? formatDateOnly(plan.intake.eventDate)
              : dictionary.common.unknown}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-muted">{dictionary.workspace.perGuest}</dt>
          <dd className="font-medium">
            {formatMinor(
              plan.intake.guests > 0 ? Math.round(budget.totalMinor / plan.intake.guests) : 0,
              currency,
            )}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-muted">{dictionary.workspace.contingency}</dt>
          <dd className="font-medium">{formatMinor(budget.contingencyMinor, currency)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-muted">{dictionary.workspace.coverage}</dt>
          <dd className="font-medium">{view.coverage.overallPercent}%</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-muted">{dictionary.workspace.milestones}</dt>
          <dd className="font-medium">
            {timeline.done}/{timeline.total}
          </dd>
        </div>
      </dl>

      <details className="mt-5 rounded-card border border-line bg-paper p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink">
          {dictionary.workspace.healthFormula}
        </summary>
        <p className="mt-2 text-sm text-ink-muted">{health.formula}</p>
        <ul className="mt-3 space-y-2">
          {health.parts.map((part) => (
            <li key={part.id} className="text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium text-ink">{part.label}</span>
                <span className="tabular-nums text-ink-muted">
                  {part.score}/100 &middot; {part.weight}%
                </span>
              </div>
              <div
                className="mt-1 h-1.5 w-full overflow-hidden rounded-pill bg-line"
                role="presentation"
              >
                <div
                  className="h-full rounded-pill bg-teal"
                  style={{ width: `${Math.max(2, part.score)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-ink-muted">{part.whatWasMeasured}</p>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
