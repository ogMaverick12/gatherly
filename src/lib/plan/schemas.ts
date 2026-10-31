import { z } from 'zod';
import {
  AccessNeedSchema,
  CityTierSchema,
  DietaryNeedSchema,
  EventTypeSchema,
  LanguageSchema,
  PrioritySchema,
  VenueTypeSchema,
} from './taxonomy';
import { TaskAreaSchema, VendorCategorySchema, VendorStatusSchema } from './categories';
import { CurrencySchema } from './currencies';
import { PackIdSchema } from './packs';

/**
 * The schemas. Every stored or received shape is defined here and its type is
 * inferred from it, so the two can never drift apart.
 */

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A calendar date string in `YYYY-MM-DD` form.
 */
export const DateOnlySchema = z
  .string()
  .regex(DATE_ONLY_PATTERN, 'Expected a calendar date as YYYY-MM-DD');

/**
 * An ISO-8601 timestamp string, as stored in plan metadata.
 */
export const IsoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Expected an ISO-8601 timestamp');

/**
 * Up to four priorities, in the order the household chose them.
 */
export const PriorityListSchema = z.array(PrioritySchema).max(4);

/**
 * Everything the intake asks for, before any plan is built.
 */
export const IntakeSchema = z
  .object({
    eventType: EventTypeSchema,
    eventDate: DateOnlySchema.nullable(),
    guests: z.number().int().min(1).max(5000),
    cityTier: CityTierSchema,
    currency: CurrencySchema,
    budgetMinor: z.number().int().min(0).max(100_000_000_000),
    priorities: PriorityListSchema,
    cultureNote: z.string().max(300),
    dietary: z.array(DietaryNeedSchema).max(12),
    access: z.array(AccessNeedSchema).max(12),
    language: LanguageSchema,
    packs: z.array(PackIdSchema).max(6),
    venueType: VenueTypeSchema,
    guestCountIsEstimate: z.boolean(),
    notes: z.string().max(2000),
  })
  .strict();

/** The answers collected during intake. */
export type Intake = z.infer<typeof IntakeSchema>;

/**
 * One checklist task in a plan.
 */
export const PlanTaskSchema = z
  .object({
    id: z.string().min(1).max(80),
    title: z.string().min(1).max(160),
    done: z.boolean(),
    area: TaskAreaSchema,
  })
  .strict();

/** One task in the plan. */
export type PlanTask = z.infer<typeof PlanTaskSchema>;

/**
 * One vendor row, including its quote and payment state.
 */
export const VendorSchema = z
  .object({
    id: z.string().min(1).max(80),
    category: VendorCategorySchema,
    name: z.string().max(120),
    status: VendorStatusSchema,
    quotedMinor: z.number().int().min(0).nullable(),
    depositMinor: z.number().int().min(0).nullable(),
    dueDate: DateOnlySchema.nullable(),
    phone: z.string().max(32),
    notes: z.string().max(600),
  })
  .strict();

/** One vendor in the plan. */
export type Vendor = z.infer<typeof VendorSchema>;

/**
 * One dated planning milestone, relative to the event.
 */
export const MilestoneSchema = z
  .object({
    id: z.string().min(1).max(80),
    title: z.string().min(1).max(160),
    date: DateOnlySchema.nullable(),
    offsetDays: z.number().int().min(-400).max(400),
    done: z.boolean(),
    owner: z.string().max(80),
    whyItMatters: z.string().max(300),
  })
  .strict();

/** One milestone in the plan. */
export type Milestone = z.infer<typeof MilestoneSchema>;

/**
 * One stored idea, with its rationale, cost impact and source.
 */
export const IdeaSchema = z
  .object({
    id: z.string().min(1).max(80),
    title: z.string().min(1).max(160),
    body: z.string().min(1).max(1200),
    rationale: z.string().max(600),
    costImpactMinor: z.number().int().nullable(),
    tags: z.array(z.string().max(40)).max(8),
    source: z.enum(['basic', 'provider']),
  })
  .strict();

/** One saved planning idea. */
export type Idea = z.infer<typeof IdeaSchema>;

/**
 * One chat message, from either the user or the assistant.
 */
export const ChatMessageSchema = z
  .object({
    id: z.string().min(1).max(80),
    role: z.enum(['user', 'assistant']),
    content: z.string().max(4000),
    mode: z.enum(['basic', 'provider']).nullable(),
    createdAt: IsoDateTimeSchema,
  })
  .strict();

/** One message in the assistant conversation. */
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * Display and motion preferences stored with a plan.
 */
export const PlanSettingsSchema = z
  .object({
    theme: z.enum(['light', 'dark', 'system']),
    textSize: z.enum(['standard', 'large', 'xlarge']),
    calmMode: z.boolean(),
    reducedMotion: z.boolean(),
  })
  .strict();

/** The plan's display and language settings. */
export type PlanSettings = z.infer<typeof PlanSettingsSchema>;

/**
 * The plan document version written by this build.
 */
export const PLAN_VERSION = 1 as const;

/**
 * The full plan document, and the only shape the store accepts.
 */
export const PlanSchema = z
  .object({
    version: z.literal(PLAN_VERSION),
    id: z.string().min(1).max(80),
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
    intake: IntakeSchema,
    tasks: z.array(PlanTaskSchema).max(400),
    vendors: z.array(VendorSchema).max(200),
    milestones: z.array(MilestoneSchema).max(200),
    ideas: z.array(IdeaSchema).max(60),
    chat: z.array(ChatMessageSchema).max(200),
    settings: PlanSettingsSchema,
  })
  .strict();

/** The complete plan stored on this device. */
export type Plan = z.infer<typeof PlanSchema>;
