'use client';

import { useAccessibility } from '@/features/accessibility/provider';
import { CelebrationDot } from './HealthRing';
import type { PlanView } from '@/lib/plan-view';
import { formatMinor } from '@/lib/money';
import { formatDateOnly } from '@/lib/dates';
import type { Risk } from '@/features/risks/services';

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-card border border-line bg-raised p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-title-lg">{value}</p>
      {hint ? <p className="mt-1 text-sm text-ink-muted">{hint}</p> : null}
    </div>
  );
}

function RiskRow({ risk }: { risk: Risk }) {
  const colour =
    risk.severity === 'high'
      ? 'var(--color-rose)'
      : risk.severity === 'medium'
        ? 'var(--color-marigold)'
        : 'var(--color-line-strong)';

  return (
    <li className="rounded-card border border-line bg-raised p-4">
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: colour }}
        />
        <div className="min-w-0">
          <h3 className="font-semibold text-ink">{risk.title}</h3>
          <p className="mt-1 text-sm text-ink-muted">{risk.explanation}</p>
          <p className="mt-2 text-sm text-ink">
            <span className="font-medium">{risk.area}:</span> {risk.mitigation}
          </p>
        </div>
      </div>
    </li>
  );
}

export function OverviewPanel({
  view,
  onToggleTask,
}: {
  view: PlanView;
  onToggleTask: (id: string) => void;
}) {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const { plan, budget, coverage, timeline, catering, risks, health } = view;
  const currency = plan.intake.currency;
  const daysToEvent = timeline.daysToEvent;

  return (
    <div className="space-y-6">
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <li>
          <StatCard
            label={t.workspace.guests}
            value={String(plan.intake.guests)}
            hint={
              plan.intake.guestCountIsEstimate
                ? t.intake.guestCountIsEstimate
                : `${catering.totalPlates} plates including the 8% buffer`
            }
          />
        </li>
        <li>
          <StatCard
            label={t.workspace.date}
            value={plan.intake.eventDate ? formatDateOnly(plan.intake.eventDate) : t.common.unknown}
            hint={
              daysToEvent === null ? t.intake.dateNotSet : `${daysToEvent} ${t.common.days} to go`
            }
          />
        </li>
        <li>
          <StatCard
            label={t.workspace.budget}
            value={formatMinor(budget.totalMinor, currency)}
            hint={`${formatMinor(budget.contingencyMinor, currency)} held back as a contingency`}
          />
        </li>
        <li>
          <StatCard
            label={t.workspace.coverage}
            value={`${coverage.overallPercent}%`}
            hint={coverage.nextAction ?? t.workspace.vendorsChecklist}
          />
        </li>
        <li>
          <StatCard
            label={t.workspace.milestones}
            value={`${timeline.done}/${timeline.total}`}
            hint={
              timeline.overdue > 0
                ? `${timeline.overdue} ${t.workspace.overdue.toLowerCase()}`
                : t.workspace.milestonesHelp
            }
          />
        </li>
        <li>
          <StatCard
            label={t.workspace.health}
            value={`${health.score}/100`}
            hint={t.workspace.healthExplainer}
          />
        </li>
      </ul>

      <section aria-labelledby="risks-heading">
        <h2 id="risks-heading" className="font-display text-title">
          {t.workspace.risks}
        </h2>
        {risks.length === 0 ? (
          <p className="mt-3 rounded-card border border-line bg-raised p-4 text-sm text-ink-muted">
            {t.workspace.noRisks}
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 lg:grid-cols-2">
            {risks.map((risk) => (
              <RiskRow key={risk.id} risk={risk} />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="tasks-heading">
        <h2 id="tasks-heading" className="font-display text-title">
          {t.workspace.nextUp}
        </h2>
        {plan.tasks.length === 0 ? (
          <p className="mt-3 rounded-card border border-line bg-raised p-4 text-sm text-ink-muted">
            {t.workspace.noPlanCta}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {plan.tasks.map((task) => (
              <li key={task.id}>
                <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-card border border-line bg-raised px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => onToggleTask(task.id)}
                    className="h-5 w-5 shrink-0 accent-[var(--color-teal)]"
                  />
                  <span className={task.done ? 'text-ink-muted line-through' : 'text-ink'}>
                    {task.title}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="catering-heading">
        <h2 id="catering-heading" className="font-display text-title">
          {t.workspace.vendorsChecklist}
        </h2>
        <div className="mt-3 rounded-card border border-line bg-raised p-5">
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-ink-muted">Plates</dt>
              <dd className="mt-1 font-display text-title-lg">{catering.totalPlates}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-ink-muted">Drinks</dt>
              <dd className="mt-1 font-display text-title-lg">{catering.drinks}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-ink-muted">Service staff</dt>
              <dd className="mt-1 font-display text-title-lg">
                {catering.servers + catering.leadStaff}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.14em] text-ink-muted">Hours</dt>
              <dd className="mt-1 font-display text-title-lg">{catering.serviceHours}</dd>
            </div>
          </dl>

          {catering.dietary.length > 0 ? (
            <ul className="mt-5 space-y-2">
              {catering.dietary.map((need) => (
                <li key={need.need} className="flex items-start gap-2.5 text-sm">
                  <CelebrationDot status={need.confirmed ? 'done' : 'late'} className="mt-1.5" />
                  <span className={need.confirmed ? 'text-ink' : 'text-ink'}>
                    <span className="font-medium">{need.label}</span> - {need.action}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </div>
  );
}
