'use client';

/**
 * The intake form shell: step progress, the active step and the navigation buttons.
 * Validation and submission live in the intake hook; this file only draws the wizard.
 */

import { Button } from '@/components/ui/Button';
import { ButtonLink } from '@/components/ui/ButtonLink';
import { useAccessibility } from '@/features/accessibility';
import { INTAKE_STEPS } from '../schema';
import { useIntakeForm } from '../hooks/use-intake-form';
import { StepProgress } from './StepProgress';
import { BasicsStep } from './steps/BasicsStep';
import { MoneyStep } from './steps/MoneyStep';
import { NeedsStep } from './steps/NeedsStep';
import { ExtrasStep } from './steps/ExtrasStep';

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
          <Button onClick={goBack} variant="secondary">
            {t.common.back}
          </Button>
        ) : null}

        {stepIndex < INTAKE_STEPS.length - 1 ? (
          <Button onClick={goNext}>{t.common.continue}</Button>
        ) : (
          <Button type="submit" tone="teal" disabled={isSubmitting}>
            {t.intake.submit}
          </Button>
        )}

        <ButtonLink
          href="/"
          variant="quiet"
          size="none"
          className="px-4 py-2.5 underline-offset-4 hover:underline"
        >
          {t.common.cancel}
        </ButtonLink>
      </div>
    </form>
  );
}
