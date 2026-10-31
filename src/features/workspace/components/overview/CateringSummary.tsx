'use client';

/**
 * The catering estimate: plates, drinks, staff and dietary follow-ups.
 * The figures are estimates, and the caveat stays with them.
 */

import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useAccessibility } from '@/features/accessibility';
import type { CateringEstimate } from '@/features/catering';
import { CelebrationDot } from '../HealthRing';

/**
 * What to order, and which dietary need still needs confirming.
 *
 * These are estimates from the guest count and the diet mix, and the section
 * says so rather than reading as a quote.
 */
export function CateringSummary({ catering }: { catering: CateringEstimate }) {
  const { dictionary } = useAccessibility();
  const t = dictionary;

  return (
    <section aria-labelledby="catering-heading">
      <h2 id="catering-heading" className="font-display text-title">
        {t.workspace.vendorsChecklist}
      </h2>
      <Card className="mt-3 p-4 sm:p-5">
        <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div>
            <dt>
              <SectionLabel spacing="wide">Plates</SectionLabel>
            </dt>
            <dd className="mt-1 font-display text-title-lg">{catering.totalPlates}</dd>
          </div>
          <div>
            <dt>
              <SectionLabel spacing="wide">Drinks</SectionLabel>
            </dt>
            <dd className="mt-1 font-display text-title-lg">{catering.drinks}</dd>
          </div>
          <div>
            <dt>
              <SectionLabel spacing="wide">Service staff</SectionLabel>
            </dt>
            <dd className="mt-1 font-display text-title-lg">
              {catering.servers + catering.leadStaff}
            </dd>
          </div>
          <div>
            <dt>
              <SectionLabel spacing="wide">Hours</SectionLabel>
            </dt>
            <dd className="mt-1 font-display text-title-lg">{catering.serviceHours}</dd>
          </div>
        </dl>

        {catering.dietary.length > 0 ? (
          <ul className="mt-4 space-y-1.5 text-xs sm:mt-5 sm:space-y-2 sm:text-sm">
            {catering.dietary.map((need) => (
              <li key={need.need} className="flex items-start gap-2.5">
                <CelebrationDot status={need.confirmed ? 'done' : 'late'} className="mt-1" />
                <span className="text-ink">
                  <span className="font-medium">{need.label}</span>
                  {need.confirmed ? null : <> - {need.action}</>}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
    </section>
  );
}
