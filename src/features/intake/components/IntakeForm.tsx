'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAccessibility } from '@/features/accessibility/provider';
import { ChipGroup } from './ChipGroup';
import {
  DEFAULT_INTAKE_VALUES,
  INTAKE_STEPS,
  IntakeFormSchema,
  STEP_FIELDS,
  type IntakeFormValues,
  type IntakeStep,
} from '../schema';
import {
  ACCESS_LABELS,
  ACCESS_NEEDS,
  CITY_TIER_LABELS,
  CITY_TIERS,
  CURRENCIES,
  CURRENCY_META,
  DIETARY_LABELS,
  DIETARY_NEEDS,
  EVENT_TYPE_LABELS,
  EVENT_TYPES,
  LANGUAGES,
  LANGUAGE_LABELS,
  PACKS,
  PACK_DISCLAIMER,
  PACK_IDS,
  PRIORITIES,
  PRIORITY_LABELS,
  VENUE_TYPE_LABELS,
  VENUE_TYPES,
  createPlan,
  type Intake,
} from '@/lib/plan';
import { fromMajorUnits, formatMinorPlain } from '@/lib/money';
import { setPlan } from '@/lib/plan-store';

function RadioChips<T extends string>({
  legend,
  help,
  options,
  value,
  onChange,
  name,
  columns = false,
}: {
  legend: string;
  help?: string;
  options: readonly { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (value: T) => void;
  name: string;
  columns?: boolean;
}) {
  const helpId = useId();
  return (
    <fieldset aria-describedby={help ? helpId : undefined} className="min-w-0">
      <legend className="font-display text-title">{legend}</legend>
      {help ? (
        <p id={helpId} className="mt-1 text-sm text-ink-muted">
          {help}
        </p>
      ) : null}
      <div className={`mt-3 grid gap-2 ${columns ? 'sm:grid-cols-3' : 'flex flex-wrap'}`}>
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={`inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-pill border px-4 py-2 text-sm transition-colors duration-200 ${
                checked
                  ? 'border-teal bg-teal text-paper'
                  : 'border-line-strong bg-raised text-ink hover:border-teal'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className="flex flex-col">
                <span>{option.label}</span>
                {option.hint ? (
                  <span className={checked ? 'text-paper/80' : 'text-ink-muted'}>
                    {option.hint}
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function IntakeForm() {
  const router = useRouter();
  const { dictionary, setLanguage } = useAccessibility();
  const t = dictionary;
  const [stepIndex, setStepIndex] = useState(0);
  const step: IntakeStep = INTAKE_STEPS[stepIndex] ?? 'basics';

  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(IntakeFormSchema),
    defaultValues: DEFAULT_INTAKE_VALUES,
    mode: 'onBlur',
  });

  const {
    register,
    control,
    watch,
    trigger,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = form;

  const values = watch();
  const currency = values.currency ?? 'INR';
  const guests = Number(values.guests) || 0;
  const budget = Number(values.budget) || 0;
  const perGuest = guests > 0 ? budget / guests : 0;

  const goNext = async () => {
    const valid = await trigger(STEP_FIELDS[step], { shouldFocus: true });
    if (!valid) return;
    setStepIndex((index) => Math.min(index + 1, INTAKE_STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setStepIndex((index) => Math.max(index - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = handleSubmit((formValues) => {
    const intake: Intake = {
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
    const plan = createPlan(intake, new Date());
    setPlan(plan);
    setLanguage(intake.language);
    router.push('/plan');
  });

  const stepLabels: Record<IntakeStep, string> = {
    basics: t.intake.basics,
    money: t.intake.money,
    needs: t.intake.needs,
    extras: t.intake.extras,
  };

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <ol className="flex flex-wrap items-center gap-2 text-sm" aria-label={t.intake.step}>
        {INTAKE_STEPS.map((name, index) => {
          const current = index === stepIndex;
          const done = index < stepIndex;
          return (
            <li key={name} className="flex items-center gap-2">
              <span
                aria-current={current ? 'step' : undefined}
                className={`inline-flex min-h-[32px] items-center gap-2 rounded-pill px-3 ${
                  current ? 'bg-ink text-paper' : done ? 'bg-teal/15 text-teal' : 'text-ink-muted'
                }`}
              >
                <span className="tabular-nums">{index + 1}</span>
                {stepLabels[name]}
                {done ? <span className="sr-only">(done)</span> : null}
              </span>
              {index < INTAKE_STEPS.length - 1 ? (
                <span aria-hidden="true" className="text-line-strong">
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>

      {step === 'basics' ? (
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
      ) : null}

      {step === 'money' ? (
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
                ? `${formatMinorPlain(Math.round(perGuest * 100), currency)} ${CURRENCY_META[currency].code} per guest, before the 8% contingency.`
                : t.intake.guestsHelp}
            </p>
          </div>
        </section>
      ) : null}

      {step === 'needs' ? (
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

          <div>
            <label htmlFor="cultureNote" className="font-display text-title">
              {t.intake.cultureNote}
            </label>
            <p id="cultureNoteHelp" className="mt-1 text-sm text-ink-muted">
              {t.intake.cultureNoteHelp}
            </p>
            <textarea
              id="cultureNote"
              rows={3}
              maxLength={300}
              aria-describedby="cultureNoteHelp"
              aria-invalid={Boolean(errors.cultureNote) || undefined}
              className="mt-2 w-full rounded-card border border-line-strong bg-raised px-3 py-2 text-ink"
              {...register('cultureNote')}
            />
            {errors.cultureNote ? (
              <p className="mt-1 text-sm font-medium text-rose">{errors.cultureNote.message}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {step === 'extras' ? (
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
                  {formatMinorPlain(Math.round(budget * 100), currency)} {currency}
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
        </section>
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
