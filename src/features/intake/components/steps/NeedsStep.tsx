'use client';

/**
 * The third intake step: priorities, dietary needs, access needs and a culture note.
 * Dietary and access options are needs the user selects, never assumptions.
 */

import { Controller, type UseFormReturn } from 'react-hook-form';
import { useAccessibility } from '@/features/accessibility';
import {
  ACCESS_LABELS,
  ACCESS_NEEDS,
  DIETARY_LABELS,
  DIETARY_NEEDS,
  PRIORITIES,
  PRIORITY_LABELS,
} from '@/lib/plan';
import type { IntakeFormValues } from '../../schema';
import { ChipGroup } from '../ChipGroup';

/** The free culture note field and its help and error text. */
function CultureNoteField({
  label,
  help,
  hasError,
  message,
  register,
}: {
  label: string;
  help: string;
  hasError: boolean;
  message?: string;
  register: UseFormReturn<IntakeFormValues>['register'];
}) {
  return (
    <div>
      <label htmlFor="cultureNote" className="font-display text-title">
        {label}
      </label>
      <p id="cultureNoteHelp" className="mt-1 text-sm text-ink-muted">
        {help}
      </p>
      <textarea
        id="cultureNote"
        rows={3}
        maxLength={300}
        aria-describedby="cultureNoteHelp"
        aria-invalid={hasError || undefined}
        className="mt-2 w-full rounded-card border border-line-strong bg-raised px-3 py-2 text-ink"
        {...register('cultureNote')}
      />
      {hasError ? <p className="mt-1 text-sm font-medium text-rose">{message}</p> : null}
    </div>
  );
}

/** What the household cares about, what guests need, and a free note. */
export function NeedsStep({ form }: { form: UseFormReturn<IntakeFormValues> }) {
  const { dictionary: t } = useAccessibility();
  const { control, register, formState } = form;
  const errors = formState.errors;

  return (
    <section className="space-y-8" aria-label={t.intake.needs}>
      <Controller
        name="priorities"
        control={control}
        render={({ field }) => (
          <ChipGroup
            legend={t.intake.priorities}
            help={t.intake.prioritiesHelp}
            max={4}
            value={field.value}
            onChange={field.onChange}
            options={PRIORITIES.map((priority) => ({
              value: priority,
              label: PRIORITY_LABELS[priority],
            }))}
          />
        )}
      />

      <Controller
        name="dietary"
        control={control}
        render={({ field }) => (
          <ChipGroup
            legend={t.intake.dietary}
            help={t.intake.dietaryHelp}
            value={field.value}
            onChange={field.onChange}
            options={DIETARY_NEEDS.map((need) => ({
              value: need,
              label: DIETARY_LABELS[need],
            }))}
          />
        )}
      />

      <Controller
        name="access"
        control={control}
        render={({ field }) => (
          <ChipGroup
            legend={t.intake.access}
            help={t.intake.accessHelp}
            value={field.value}
            onChange={field.onChange}
            options={ACCESS_NEEDS.map((need) => ({
              value: need,
              label: ACCESS_LABELS[need],
            }))}
          />
        )}
      />

      <CultureNoteField
        label={t.intake.cultureNote}
        help={t.intake.cultureNoteHelp}
        hasError={Boolean(errors.cultureNote)}
        message={errors.cultureNote?.message}
        register={register}
      />
    </section>
  );
}
