'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { useAccessibility } from '@/features/accessibility/provider';
import {
  CITY_TIER_LABELS,
  CITY_TIERS,
  EVENT_TYPE_LABELS,
  EVENT_TYPES,
  VENUE_TYPE_LABELS,
  VENUE_TYPES,
} from '@/lib/plan';
import type { IntakeFormValues } from '../../schema';
import { RadioChips } from '../RadioChips';

// long-function: one view section, kept in one block so its reading order stays visible.
/** Event type, date, head count, city tier and venue: what the event is. */
export function BasicsStep({
  form,
  values,
}: {
  form: UseFormReturn<IntakeFormValues>;
  values: IntakeFormValues;
}) {
  const { dictionary: t } = useAccessibility();
  const { control, register, formState } = form;
  const errors = formState.errors;

  return (
    <section className="space-y-8" aria-label={t.intake.basics}>
      <Controller
        name="eventType"
        control={control}
        render={({ field }) => (
          <RadioChips
            name="eventType"
            legend={t.intake.eventType}
            help={t.intake.eventTypeHelp}
            value={field.value}
            onChange={field.onChange}
            options={EVENT_TYPES.map((type) => ({
              value: type,
              label: EVENT_TYPE_LABELS[type],
            }))}
            columns
          />
        )}
      />

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

      <Controller
        name="cityTier"
        control={control}
        render={({ field }) => (
          <RadioChips
            name="cityTier"
            legend={t.intake.cityTier}
            help={t.intake.cityTierHelp}
            value={field.value}
            onChange={field.onChange}
            options={CITY_TIERS.map((tier) => ({
              value: tier,
              label: CITY_TIER_LABELS[tier],
            }))}
          />
        )}
      />

      <Controller
        name="venueType"
        control={control}
        render={({ field }) => (
          <RadioChips
            name="venueType"
            legend={t.intake.venueType}
            help={t.intake.venueTypeHelp}
            value={field.value}
            onChange={field.onChange}
            options={VENUE_TYPES.map((venue) => ({
              value: venue,
              label: VENUE_TYPE_LABELS[venue],
            }))}
          />
        )}
      />
    </section>
  );
}
