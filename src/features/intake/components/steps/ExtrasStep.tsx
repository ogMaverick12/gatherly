'use client';

/**
 * The last intake step: optional packs, interface language, a note and the review.
 * Packs are opt-in and carry the disclaimer that they are a starting point to confirm.
 */

import { Controller, type UseFormReturn } from 'react-hook-form';
import { useAccessibility } from '@/features/accessibility';
import {
  LANGUAGES,
  LANGUAGE_LABELS,
  PACKS,
  PACK_DISCLAIMER,
  PACK_IDS,
  type Currency,
} from '@/lib/plan';
import type { IntakeFormValues } from '../../schema';
import { ChipGroup } from '../ChipGroup';
import { RadioChips } from '../RadioChips';
import { ReviewSummary } from '../ReviewSummary';

/** Optional packs, the interface language and a free note, then the review. */
export function ExtrasStep({
  form,
  values,
  currency,
  budget,
}: {
  form: UseFormReturn<IntakeFormValues>;
  values: IntakeFormValues;
  currency: Currency;
  budget: number;
}) {
  const { dictionary: t } = useAccessibility();
  const { control, register, formState } = form;
  const errors = formState.errors;

  return (
    <section className="space-y-8" aria-label={t.intake.extras}>
      <Controller
        name="packs"
        control={control}
        render={({ field }) => (
          <ChipGroup
            legend={t.intake.packs}
            help={t.intake.packsHelp}
            value={field.value}
            onChange={field.onChange}
            options={PACK_IDS.map((id) => ({
              value: id,
              label: PACKS[id].name,
              hint: PACKS[id].blurb,
            }))}
            errorMessage={PACK_DISCLAIMER}
          />
        )}
      />

      <Controller
        name="language"
        control={control}
        render={({ field }) => (
          <RadioChips
            name="language"
            legend={t.intake.language}
            value={field.value}
            onChange={field.onChange}
            options={LANGUAGES.map((code) => ({
              value: code,
              label: LANGUAGE_LABELS[code],
            }))}
          />
        )}
      />

      <div>
        <label htmlFor="notes" className="font-display text-title">
          {t.intake.notes}
        </label>
        <textarea
          id="notes"
          rows={4}
          maxLength={2000}
          aria-invalid={Boolean(errors.notes) || undefined}
          className="mt-2 w-full rounded-card border border-line-strong bg-raised px-3 py-2 text-ink"
          {...register('notes')}
        />
        {errors.notes ? (
          <p className="mt-1 text-sm font-medium text-rose">{errors.notes.message}</p>
        ) : null}
      </div>

      <ReviewSummary values={values} currency={currency} budget={budget} />
    </section>
  );
}
