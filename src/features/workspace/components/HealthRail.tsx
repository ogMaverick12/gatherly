'use client';

/**
 * The health rail beside the workspace: score, band, next action and key figures.
 * The formula is disclosed in place so the score can be checked, not just trusted.
 */

import { useAccessibility } from '@/features/accessibility';
import type { HealthBand } from '@/features/health';
import { formatDateOnly } from '@/lib/dates';
import type { Dictionary } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import type { PlanView } from '../plan-view';
import { CelebrationDot, HealthRing } from './HealthRing';

const BAND_LABEL: Record<HealthBand, string> = {
  on_track: 'On track',
  attention: 'Worth attention',
  at_risk: 'At risk',
};

/** The score ring, band and one-line explanation. */
export function HealthSummary({
  view,
  t,
  compact = false,
}: {
  readonly view: PlanView;
  readonly t: Dictionary;
  readonly compact?: boolean;
}) {
  const { health } = view;
  return (
    <div className={compact ? 'flex items-center gap-3' : 'flex items-center gap-4'}>
      <HealthRing
        score={health.score}
        band={health.band}
        size={compact ? 80 : 104}
        label={t.workspace.health}
      />
      <div>
        <h2 className={compact ? 'font-display text-title' : 'font-display text-title-lg'}>
          {t.workspace.health}
        </h2>
        <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-ink">
          <CelebrationDot
            status={
              health.band === 'on_track' ? 'done' : health.band === 'attention' ? 'waiting' : 'late'
            }
          />
          {BAND_LABEL[health.band]}
        </p>
        {compact ? null : (
          <p className="mt-1 text-xs text-ink-muted">{t.workspace.healthExplainer}</p>
        )}
      </div>
    </div>
  );
}

/** The compact health card shown above the panel on phones. */
export function MobileHealthSummary({
  view,
  t,
}: {
  readonly view: PlanView;
  readonly t: Dictionary;
}) {
  return (
    <div className="mt-4 rounded-card border border-line bg-raised p-3 shadow-card lg:hidden">
      <HealthSummary view={view} t={t} compact />
    </div>
  );
}

/** The next action callout, when there is one. */
export function HealthNextAction({
  nextAction,
  t,
}: {
  readonly nextAction: string | null;
  readonly t: Dictionary;
}) {
  if (!nextAction) return null;
  return (
    <div className="mt-5 rounded-card border border-line bg-paper p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-teal">
        {t.workspace.nextUp}
      </h3>
      <p className="mt-1.5 text-sm text-ink">{nextAction}</p>
    </div>
  );
}

/** The headline guest, date, budget and coverage figures. */
export function HealthFigures({ view, t }: { readonly view: PlanView; readonly t: Dictionary }) {
  const { plan, budget, timeline } = view;
  const currency = plan.intake.currency;
  return (
    <dl className="mt-5 space-y-2.5 text-sm">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-ink-muted">{t.workspace.guests}</dt>
        <dd className="font-medium">{plan.intake.guests}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-ink-muted">{t.workspace.date}</dt>
        <dd className="font-medium">
          {plan.intake.eventDate ? formatDateOnly(plan.intake.eventDate) : t.common.unknown}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-ink-muted">{t.workspace.perGuest}</dt>
        <dd className="font-medium">
          {formatMoney(
            plan.intake.guests > 0 ? Math.round(budget.totalMinor / plan.intake.guests) : 0,
            currency,
          )}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-ink-muted">{t.workspace.contingency}</dt>
        <dd className="font-medium">{formatMoney(budget.contingencyMinor, currency)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-ink-muted">{t.workspace.coverage}</dt>
        <dd className="font-medium">{view.coverage.overallPercent}%</dd>
      </div>
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-ink-muted">{t.workspace.milestones}</dt>
        <dd className="font-medium">
          {timeline.done}/{timeline.total}
        </dd>
      </div>
    </dl>
  );
}

/** The disclosed weighted parts behind the health score. */
export function HealthFormula({
  health,
  t,
}: {
  readonly health: PlanView['health'];
  readonly t: Dictionary;
}) {
  return (
    <details className="mt-5 rounded-card border border-line bg-paper p-4">
      <summary className="cursor-pointer text-sm font-semibold text-ink">
        {t.workspace.healthFormula}
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
  );
}

/**
 * Show the plan's health score with its band, next action and headline figures.
 * The details element lists every weighted part behind the score.
 */
export function HealthRail({ view }: { view: PlanView }) {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  return (
    <div className="rounded-card border border-line bg-raised p-5 shadow-card">
      <HealthSummary view={view} t={t} />
      <HealthNextAction nextAction={view.health.nextAction} t={t} />
      <HealthFigures view={view} t={t} />
      <HealthFormula health={view.health} t={t} />
    </div>
  );
}
