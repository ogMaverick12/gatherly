'use client';

/**
 * The date and guest-count fields for the first intake step.
 */

import type { UseFormReturn } from 'react-hook-form';
import type { Dictionary } from '@/lib/i18n';
import type { IntakeFormValues } from '../../schema';

/**
 * Render the event-date and guest-count controls with their validation messages.
 * @param props the form, current values and dictionary
 * @returns the two-column field group
 */
export function DateGuestsFields({
  form,
  values,
  t,
}: {
  readonly form: UseFormReturn<IntakeFormValues>;
  readonly values: IntakeFormValues;
  readonly t: Dictionary;
}) {
  const { register, formState } = form;
  const errors = formState.errors;
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div>
        <label htmlFor="eventDate" className="font-display text-title">
          {t.intake.eventDate}
        </label>
        <p id="eventDateHelp" className="mt-1 text-sm text-ink-muted">
          {t.intake.eventDateHelp}
        </p>
        <input
          id="eventDate"
          type="date"
          disabled={values.dateNotSet}
          aria-describedby="eventDateHelp"
          aria-invalid={Boolean(errors.eventDate) || undefined}
          className="mt-2 min-h-[44px] w-full rounded-card border border-line-strong bg-raised px-3 py-2 text-ink disabled:opacity-50"
          {...register('eventDate')}
        />
        {errors.eventDate ? (
          <p className="mt-1 text-sm font-medium text-rose">{t.intake.badDate}</p>
        ) : null}
        <label className="mt-3 flex min-h-[44px] cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[var(--color-teal)]"
            {...register('dateNotSet')}
          />
          {t.intake.dateNotSet}
        </label>
      </div>

      <div>
        <label htmlFor="guests" className="font-display text-title">
          {t.intake.guests}
        </label>
        <p id="guestsHelp" className="mt-1 text-sm text-ink-muted">
          {t.intake.guestsHelp}
        </p>
        <input
          id="guests"
          type="number"
          inputMode="numeric"
          min={1}
          max={5000}
          aria-describedby="guestsHelp"
          aria-invalid={Boolean(errors.guests) || undefined}
          className="mt-2 min-h-[44px] w-full rounded-card border border-line-strong bg-raised px-3 py-2 text-ink"
          {...register('guests', { valueAsNumber: true })}
        />
        {errors.guests ? (
          <p className="mt-1 text-sm font-medium text-rose">{errors.guests.message}</p>
        ) : null}
        <label className="mt-3 flex min-h-[44px] cursor-pointer items-center gap-3 text-sm">
          <input
            type="checkbox"
            className="h-5 w-5 accent-[var(--color-teal)]"
            {...register('guestCountIsEstimate')}
          />
          {t.intake.guestCountIsEstimate}
        </label>
      </div>
    </div>
  );
}
