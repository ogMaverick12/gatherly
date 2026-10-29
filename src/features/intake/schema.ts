import { z } from 'zod';
import {
  ACCESS_NEEDS,
  CITY_TIERS,
  CURRENCIES,
  DIETARY_NEEDS,
  EVENT_TYPES,
  LANGUAGES,
  PACK_IDS,
  PRIORITIES,
  VENUE_TYPES,
} from '@/lib/plan';
import { isValidDateOnly } from '@/lib/dates';

/**
 * The intake form.
 *
 * The form shape is slightly wider than the stored `Intake`: the budget is
 * entered in major units (a person types 15000, not 15000000) and the
 * event date can be left unset. Both are converted when the plan is built.
 */

/**
 * The intake form schema, validated as the user moves through the steps.
 * Budgets are entered in major units; dates must be ISO `YYYY-MM-DD` unless "not set".
 */
export const IntakeFormSchema = z
  .object({
    eventType: z.enum(EVENT_TYPES),
    eventDate: z.string(),
    dateNotSet: z.boolean(),
    guests: z
      .number({ invalid_type_error: 'Enter a number of guests.' })
      .int()
      .min(1, 'At least one guest.')
      .max(5000, 'That is more than 5000 guests - is that right?'),
    guestCountIsEstimate: z.boolean(),
    cityTier: z.enum(CITY_TIERS),
    venueType: z.enum(VENUE_TYPES),
    currency: z.enum(CURRENCIES),
    budget: z
      .number({ invalid_type_error: 'Enter a budget.' })
      .min(0, 'A budget of zero is allowed, but the plan will be thin.')
      .max(100_000_000, 'That is more than the app can plan for.'),
    priorities: z.array(z.enum(PRIORITIES)).max(4),
    dietary: z.array(z.enum(DIETARY_NEEDS)),
    access: z.array(z.enum(ACCESS_NEEDS)),
    cultureNote: z.string().max(300, 'Keep this under 300 characters.'),
    packs: z.array(z.enum(PACK_IDS)),
    language: z.enum(LANGUAGES),
    notes: z.string().max(2000, 'Keep this under 2000 characters.'),
  })
  .strict()
  .superRefine((values, ctx) => {
    if (values.dateNotSet) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(values.eventDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['eventDate'],
        message: 'Use the date picker.',
      });
      return;
    }
    if (!isValidDateOnly(values.eventDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['eventDate'],
        message: 'That date does not exist.',
      });
    }
  });

export type IntakeFormValues = z.infer<typeof IntakeFormSchema>;

/** The four form steps, in the order they are shown. */
export const INTAKE_STEPS = ['basics', 'money', 'needs', 'extras'] as const;

export type IntakeStep = (typeof INTAKE_STEPS)[number];

/**
 * Which fields each step validates, so the next button can gate on that step alone.
 */
export const STEP_FIELDS: Record<IntakeStep, (keyof IntakeFormValues)[]> = {
  basics: [
    'eventType',
    'eventDate',
    'dateNotSet',
    'guests',
    'guestCountIsEstimate',
    'cityTier',
    'venueType',
  ],
  money: ['currency', 'budget'],
  needs: ['priorities', 'dietary', 'access', 'cultureNote'],
  extras: ['packs', 'language', 'notes'],
};

/** The starting values for a new form, chosen to be plausible rather than empty. */
export const DEFAULT_INTAKE_VALUES: IntakeFormValues = {
  eventType: 'wedding',
  eventDate: '',
  dateNotSet: true,
  guests: 100,
  guestCountIsEstimate: true,
  cityTier: 'tier2',
  venueType: 'mixed',
  currency: 'INR',
  budget: 500000,
  priorities: [],
  dietary: [],
  access: [],
  cultureNote: '',
  packs: [],
  language: 'en',
  notes: '',
};
