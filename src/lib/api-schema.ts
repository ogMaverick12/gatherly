import { z } from 'zod';
import {
  CityTierSchema,
  CurrencySchema,
  DietaryNeedSchema,
  EventTypeSchema,
  PrioritySchema,
} from '@/lib/plan';
import type { PlanSnapshot } from '@/features/assistant/services';

/**
 * Request and response schemas for the API routes.
 *
 * Everything that crosses the network is validated here. The client is not
 * trusted: a snapshot is a *description* of a plan, and the server only
 * uses the numbers to write an answer.
 */

export const PlanSummarySchema = z
  .string()
  .min(1)
  .max(8000)
  .refine((value) => !value.includes('<user_input>'), {
    message: 'The plan summary must not contain user input delimiters.',
  });

// Annotated with the domain type so a validated body can be handed to the
// assistant's services without a cast: the schema is the only place the two
// shapes are allowed to meet.
export const SnapshotSchema: z.ZodType<PlanSnapshot> = z
  .object({
    eventType: EventTypeSchema,
    eventDate: z.string().max(10).nullable(),
    guests: z.number().int().min(1).max(5000),
    cityTier: CityTierSchema,
    currency: CurrencySchema,
    budgetMinor: z.number().int().min(0).max(100_000_000_000),
    contingencyMinor: z.number().int().min(0).max(100_000_000_000),
    perGuestMinor: z.number().int().min(0).max(100_000_000_000),
    categories: z
      .array(
        z
          .object({
            label: z.string().min(1).max(60),
            amountMinor: z.number().int().min(0),
            sharePercent: z.number().min(0).max(100),
          })
          .strict(),
      )
      .max(24),
    healthScore: z.number().int().min(0).max(100),
    healthBand: z.enum(['on_track', 'attention', 'at_risk']),
    nextMilestone: z.string().max(160).nullable(),
    nextMilestoneDate: z.string().max(10).nullable(),
    overdueCount: z.number().int().min(0).max(200),
    milestonesDone: z.number().int().min(0).max(200),
    milestonesTotal: z.number().int().min(0).max(200),
    vendorCoveragePercent: z.number().int().min(0).max(100),
    outstandingVendors: z.array(z.string().max(120)).max(24),
    plates: z.number().int().min(0).max(100_000),
    drinks: z.number().int().min(0).max(100_000),
    dietary: z.array(z.string().max(60)).max(24),
    tasksDone: z.number().int().min(0).max(200),
    tasksTotal: z.number().int().min(0).max(200),
    topRisks: z.array(z.string().max(200)).max(12),
  })
  .strict();

export type ApiSnapshot = z.infer<typeof SnapshotSchema>;

export const ChatRequestSchema = z
  .object({
    message: z.string().min(1).max(2000),
    planSummary: PlanSummarySchema,
    snapshot: SnapshotSchema,
  })
  .strict();

export const IdeasRequestSchema = z
  .object({
    planSummary: PlanSummarySchema,
    context: z
      .object({
        guests: z.number().int().min(1).max(5000),
        eventType: EventTypeSchema,
        cityTier: CityTierSchema,
        currency: CurrencySchema,
        budgetMinor: z.number().int().min(0).max(100_000_000_000),
        perGuestMinor: z.number().int().min(0).max(100_000_000_000),
        priorities: z.array(PrioritySchema).max(8),
        dietary: z.array(DietaryNeedSchema).max(16),
        month: z.number().int().min(1).max(12).nullable(),
      })
      .strict(),
  })
  .strict();

export const ParseRequestSchema = z
  .object({
    text: z.string().min(1).max(2000),
  })
  .strict();

export const ProviderIdeaSchema = z
  .object({
    title: z.string().min(1).max(160),
    body: z.string().min(1).max(1200),
    rationale: z.string().max(600),
    tags: z.array(z.string().max(40)).max(8),
  })
  .strict();

export const ProviderIdeasSchema = z
  .object({
    ideas: z.array(ProviderIdeaSchema).max(8),
  })
  .strict();

export type ProviderIdea = z.infer<typeof ProviderIdeaSchema>;

export const ParsedFieldsSchema = z
  .object({
    eventType: EventTypeSchema.nullable(),
    eventDate: z.string().max(10).nullable(),
    guests: z.number().int().min(1).max(5000).nullable(),
    cityTier: CityTierSchema.nullable(),
    currency: CurrencySchema.nullable(),
    budgetMinor: z.number().int().min(0).max(100_000_000_000).nullable(),
    priorities: z.array(z.string().max(40)).max(8),
    dietary: z.array(z.string().max(40)).max(16),
    access: z.array(z.string().max(40)).max(16),
    notes: z.string().max(1000),
  })
  .strict();

export type ParsedFields = z.infer<typeof ParsedFieldsSchema>;
