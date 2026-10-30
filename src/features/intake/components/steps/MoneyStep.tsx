'use client';

/**
 * The second intake step: currency, budget and the per-guest figure.
 * The per-guest line updates as the budget or guest count changes.
 */

import { type UseFormReturn } from 'react-hook-form';
import { useAccessibility } from '@/features/accessibility/provider';
import { CURRENCIES, CURRENCY_META, type Currency } from '@/lib/plan';
import { formatMoneyPlain } from '@/lib/money';
import type { IntakeFormValues } from '../../schema';

// long-function: one view section, kept in one block so its reading order stays visible.
/** The currency, the budget and what that works out to per guest. */
export function MoneyStep({
  form,
  currency,
  guests,
  perGuest,
}: {
  form: UseFormReturn<IntakeFormValues>;
  currency: Currency;
  guests: number;
  perGuest: number;
}) {
  const { dictionary: t } = useAccessibility();
  const { register, formState } = form;
  const errors = formState.errors;

  return (
    <section className="space-y-8" aria-label={t.intake.money}>
      <div>
        <label htmlFor="currency" className="font-display text-title">
          {t.intake.currency}
        </label>
        <p id="currencyHelp" className="mt-1 text-sm text-ink-muted">
          {t.intake.currencyHelp}
        </p>
        <select
          id="currency"
          aria-describedby="currencyHelp"
          className="mt-2 min-h-[44px] w-full rounded-card border border-line-strong bg-raised px-3 py-2 text-ink"
          {...register('currency')}
        >
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code} - {CURRENCY_META[code].label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="budget" className="font-display text-title">
          {t.intake.budget}
        </label>
        <p id="budgetHelp" className="mt-1 text-sm text-ink-muted">
          {t.intake.budgetHelp}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span aria-hidden="true" className="font-display text-xl text-ink-muted">
            {CURRENCY_META[currency].symbol}
          </span>
          <input
            id="budget"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            aria-describedby="budgetHelp budgetPerGuest"
            aria-invalid={Boolean(errors.budget) || undefined}
            className="min-h-[44px] w-full rounded-card border border-line-strong bg-raised px-3 py-2 text-ink"
            {...register('budget', { valueAsNumber: true })}
          />
        </div>
        {errors.budget ? (
          <p className="mt-1 text-sm font-medium text-rose">{errors.budget.message}</p>
        ) : null}
        <p id="budgetPerGuest" className="mt-2 text-sm text-ink-muted">
          {guests > 0
            ? `${formatMoneyPlain(Math.round(perGuest * 100), currency)} ${CURRENCY_META[currency].code} per guest, before the 8% contingency.`
            : t.intake.guestsHelp}
        </p>
      </div>
    </section>
  );
}
