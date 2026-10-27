'use client';

import { useAccessibility } from '@/features/accessibility/provider';
import type { CateringEstimate } from '@/features/catering/services';
import { CelebrationDot } from '../HealthRing';

/**
 * What to order, and which dietary need still needs confirming.
 *
 * These are estimates from the guest count and the diet mix, and the section
 * says so rather than reading as a quote.
 * long-function: one section: the estimate, the diet split and the caveat are read as a single statement.
 */
export function CateringSummary({ catering }: { catering: CateringEstimate }) {
  const { dictionary } = useAccessibility();
  const t = dictionary;

  return (
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
  );
}
