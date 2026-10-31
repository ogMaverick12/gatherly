'use client';

/**
 * The first intake step: event type, date, guests, city tier and venue.
 * Fields register with the shared form so validation stays in the schema.
 */

import { Controller, type UseFormReturn } from 'react-hook-form';
import { useAccessibility } from '@/features/accessibility';
import {
  CITY_TIER_LABELS,
  CITY_TIERS,
  EVENT_TYPE_LABELS,
  EVENT_TYPES,
  VENUE_TYPE_LABELS,
  VENUE_TYPES,
} from '@/lib/plan';
import type { Dictionary } from '@/lib/i18n';
import type { IntakeFormValues } from '../../schema';
import { RadioChips } from '../RadioChips';
import { DateGuestsFields } from './DateGuestsFields';

/** The event-type choice. */
function EventTypeField({
  form,
  t,
}: {
  readonly form: UseFormReturn<IntakeFormValues>;
  readonly t: Dictionary;
}) {
  return (
    <Controller
      name="eventType"
      control={form.control}
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
  );
}

/** The city-tier choice. */
function CityTierField({
  form,
  t,
}: {
  readonly form: UseFormReturn<IntakeFormValues>;
  readonly t: Dictionary;
}) {
  return (
    <Controller
      name="cityTier"
      control={form.control}
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
  );
}

/** The venue-type choice. */
function VenueTypeField({
  form,
  t,
}: {
  readonly form: UseFormReturn<IntakeFormValues>;
  readonly t: Dictionary;
}) {
  return (
    <Controller
      name="venueType"
      control={form.control}
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
  );
}

/** Event type, date, head count, city tier and venue: what the event is. */
export function BasicsStep({
  form,
  values,
}: {
  form: UseFormReturn<IntakeFormValues>;
  values: IntakeFormValues;
}) {
  const { dictionary: t } = useAccessibility();
  return (
    <section className="space-y-8" aria-label={t.intake.basics}>
      <EventTypeField form={form} t={t} />
      <DateGuestsFields form={form} values={values} t={t} />
      <CityTierField form={form} t={t} />
      <VenueTypeField form={form} t={t} />
    </section>
  );
}
