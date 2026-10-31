'use client';

/**
 * The risk register for the current plan.
 * Severity is repeated in text and dot colour, and every risk carries a mitigation.
 */

import { Card } from '@/components/ui/Card';
import { useAccessibility } from '@/features/accessibility';
import type { Risk } from '@/features/risks';

/**
 * The severity dot is decoration: the severity is written in the text as well,
 * so it survives a monochrome screen or a reader.
 */
function RiskRow({ risk, areaLabel }: { risk: Risk; areaLabel: string }) {
  const colour =
    risk.severity === 'high'
      ? 'var(--color-rose)'
      : risk.severity === 'medium'
        ? 'var(--color-marigold)'
        : 'var(--color-line-strong)';

  return (
    <Card as="li" className="p-3 sm:p-4">
      <div className="flex items-start gap-2.5 sm:gap-3">
        <span
          aria-hidden="true"
          className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: colour }}
        />
        <div className="min-w-0">
          <h3 className="font-semibold text-ink">{risk.title}</h3>
          <p className="mt-1 text-sm text-ink-muted">{risk.explanation}</p>
          <p className="mt-1.5 text-sm text-ink">
            <span className="font-medium">{areaLabel}:</span> {risk.mitigation}
          </p>
        </div>
      </div>
    </Card>
  );
}

/** Everything the risk register has to say about this plan. */
export function RiskList({ risks }: { risks: readonly Risk[] }) {
  const { dictionary } = useAccessibility();
  const t = dictionary;

  return (
    <section aria-labelledby="risks-heading">
      <h2 id="risks-heading" className="font-display text-title">
        {t.workspace.risks}
      </h2>
      {risks.length === 0 ? (
        <Card as="p" padding="md" className="mt-3 text-sm text-ink-muted">
          {t.workspace.noRisks}
        </Card>
      ) : (
        <ul className="mt-3 grid gap-3 lg:grid-cols-2">
          {risks.map((risk) => (
            <RiskRow key={risk.id} risk={risk} areaLabel={t.workspace.riskAreas[risk.area]} />
          ))}
        </ul>
      )}
    </section>
  );
}
