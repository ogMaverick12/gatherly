'use client';

/**
 * The review card shown at the end of intake.
 * It restates the answers in the order they were asked, using the same labels.
 */

import { useAccessibility } from '@/features/accessibility';
import { CITY_TIER_LABELS, EVENT_TYPE_LABELS, PRIORITY_LABELS, type Currency } from '@/lib/plan';
import { formatMoneyPlain } from '@/lib/money';
import type { IntakeFormValues } from '../schema';

// long-function: one view section, kept in one block so its reading order stays visible.
/** The answers so far, so the user can check them before submitting. */
export function ReviewSummary({
  values,
  currency,
  budget,
}: {
  values: IntakeFormValues;
  currency: Currency;
  budget: number;
}) {
  const { dictionary: t } = useAccessibility();

  return (
    <div className="rounded-card border border-line bg-raised p-5">
      <h2 className="font-display text-title">{t.intake.review}</h2>
      <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-ink-muted">{t.intake.eventType}</dt>
          <dd>{EVENT_TYPE_LABELS[values.eventType]}</dd>
        </div>
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-ink-muted">{t.intake.eventDate}</dt>
          <dd>{values.dateNotSet ? t.intake.dateNotSet : values.eventDate}</dd>
        </div>
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-ink-muted">{t.intake.guests}</dt>
          <dd>{values.guests}</dd>
        </div>
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-ink-muted">{t.intake.budget}</dt>
          <dd>
            {formatMoneyPlain(Math.round(budget * 100), currency)} {currency}
          </dd>
        </div>
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-ink-muted">{t.intake.cityTier}</dt>
          <dd>{CITY_TIER_LABELS[values.cityTier]}</dd>
        </div>
        <div className="flex justify-between gap-4 sm:block">
          <dt className="text-ink-muted">{t.intake.priorities}</dt>
          <dd>
            {values.priorities.length > 0
              ? values.priorities.map((priority) => PRIORITY_LABELS[priority]).join(', ')
              : t.common.none}
          </dd>
        </div>
      </dl>
    </div>
  );
}
