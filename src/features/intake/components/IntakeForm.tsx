'use client';

/**
 * The intake form shell: step progress, the active step and the navigation buttons.
 * Validation and submission live in the intake hook; this file only draws the wizard.
 */

import Link from 'next/link';
import { useAccessibility } from '@/features/accessibility';
import { INTAKE_STEPS } from '../schema';
import { useIntakeForm } from '../hooks/use-intake-form';
import { StepProgress } from './StepProgress';
import { BasicsStep } from './steps/BasicsStep';
import { MoneyStep } from './steps/MoneyStep';
import { NeedsStep } from './steps/NeedsStep';
import { ExtrasStep } from './steps/ExtrasStep';

// long-function: one view section, kept in one block so its reading order stays visible.
/** The four-step intake, one section per step, with a validation gate between. */
export function IntakeForm() {
  const { dictionary: t } = useAccessibility();
  const {
    form,
    values,
    step,
    stepIndex,
    currency,
    guests,
    budget,
    perGuest,
    isSubmitting,
    goNext,
    goBack,
    onSubmit,
  } = useIntakeForm();

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <StepProgress stepIndex={stepIndex} />

      {step === 'basics' ? <BasicsStep form={form} values={values} /> : null}
      {step === 'money' ? (
        <MoneyStep form={form} currency={currency} guests={guests} perGuest={perGuest} />
      ) : null}
      {step === 'needs' ? <NeedsStep form={form} /> : null}
      {step === 'extras' ? (
        <ExtrasStep form={form} values={values} currency={currency} budget={budget} />
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
        {stepIndex > 0 ? (
          <button
            type="button"
            onClick={goBack}
            className="inline-flex min-h-[44px] items-center justify-center rounded-pill border border-line-strong px-6 py-2.5 text-sm font-semibold text-ink"
          >
            {t.common.back}
          </button>
        ) : null}

        {stepIndex < INTAKE_STEPS.length - 1 ? (
          <button
            type="button"
            onClick={goNext}
            className="inline-flex min-h-[44px] items-center justify-center rounded-pill bg-ink px-6 py-2.5 text-sm font-semibold text-paper"
          >
            {t.common.continue}
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-[44px] items-center justify-center rounded-pill bg-teal px-6 py-2.5 text-sm font-semibold text-paper disabled:opacity-60"
          >
            {t.intake.submit}
          </button>
        )}

        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center justify-center rounded-pill px-4 py-2.5 text-sm text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          {t.common.cancel}
        </Link>
      </div>
    </form>
  );
}
