'use client';

/**
 * The intake wizard controller.
 * It owns the step gate, the form values and the submit that stores the plan.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAccessibility } from '@/features/accessibility';
import { createPlan, type Currency, type Intake } from '@/lib/plan';
import { fromMajorUnits } from '@/lib/money';
import { setPlan } from '@/lib/plan-store';
import {
  DEFAULT_INTAKE_VALUES,
  INTAKE_STEPS,
  IntakeFormSchema,
  STEP_FIELDS,
  type IntakeFormValues,
  type IntakeStep,
} from '../schema';

export interface IntakeFormController {
  readonly form: UseFormReturn<IntakeFormValues>;
  readonly values: IntakeFormValues;
  readonly step: IntakeStep;
  readonly stepIndex: number;
  readonly currency: Currency;
  readonly guests: number;
  readonly budget: number;
  readonly perGuest: number;
  readonly isSubmitting: boolean;
  goNext(): Promise<void>;
  goBack(): void;
  onSubmit(event?: React.BaseSyntheticEvent): Promise<void>;
}

/** Convert validated form values into the stored intake shape. */
function toIntake(formValues: IntakeFormValues): Intake {
  return {
    eventType: formValues.eventType,
    eventDate: formValues.dateNotSet ? null : formValues.eventDate,
    guests: formValues.guests,
    cityTier: formValues.cityTier,
    currency: formValues.currency,
    budgetMinor: fromMajorUnits(formValues.budget, formValues.currency),
    priorities: formValues.priorities,
    cultureNote: formValues.cultureNote,
    dietary: formValues.dietary,
    access: formValues.access,
    language: formValues.language,
    packs: formValues.packs,
    venueType: formValues.venueType,
    guestCountIsEstimate: formValues.guestCountIsEstimate,
    notes: formValues.notes,
  };
}

/** Own the current step and the validated next/back transitions. */
function useStepNavigation(form: UseFormReturn<IntakeFormValues>) {
  const [stepIndex, setStepIndex] = useState(0);
  const step: IntakeStep = INTAKE_STEPS[stepIndex] ?? 'basics';
  const goNext = async () => {
    const valid = await form.trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (!valid) return;
    setStepIndex((index) => Math.min(index + 1, INTAKE_STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goBack = () => {
    setStepIndex((index) => Math.max(index - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return { step, stepIndex, goNext, goBack };
}

/** Build the submit handler that stores the plan and moves to the workspace. */
function useIntakeSubmit(
  form: UseFormReturn<IntakeFormValues>,
  router: ReturnType<typeof useRouter>,
  setLanguage: (language: Intake['language']) => void,
) {
  return form.handleSubmit((formValues) => {
    const intake = toIntake(formValues);
    const plan = createPlan(intake, new Date());
    setPlan(plan);
    setLanguage(intake.language);
    router.push('/plan');
  });
}

/**
 * Everything the intake form does except draw anything: the four steps, the
 * per-step validation gate, and the submit that stores the plan and moves to
 * the workspace.
 */
export function useIntakeForm(): IntakeFormController {
  const router = useRouter();
  const { setLanguage } = useAccessibility();
  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(IntakeFormSchema),
    defaultValues: DEFAULT_INTAKE_VALUES,
    mode: 'onBlur',
  });
  const values = form.watch();
  const currency: Currency = values.currency ?? 'INR';
  const guests = Number(values.guests) || 0;
  const budget = Number(values.budget) || 0;
  const perGuest = guests > 0 ? budget / guests : 0;
  const { step, stepIndex, goNext, goBack } = useStepNavigation(form);
  const onSubmit = useIntakeSubmit(form, router, setLanguage);
  return {
    form,
    values,
    step,
    stepIndex,
    currency,
    guests,
    budget,
    perGuest,
    isSubmitting: form.formState.isSubmitting,
    goNext,
    goBack,
    onSubmit,
  };
}
