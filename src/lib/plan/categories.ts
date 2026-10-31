import { z } from 'zod';

/**
 * Every value the app groups work, money and vendors by: budget categories,
 * vendor categories and their statuses, and the areas a checklist task can
 * belong to. Kept apart from the event vocabularies so neither file grows past
 * a screenful.
 */

export const BUDGET_CATEGORIES = [
  'venue',
  'catering',
  'photography',
  'decor',
  'music',
  'attire',
  'transport',
  'stationery',
  'entertainment',
  'officiant',
  'accommodation',
  'gifts',
] as const;
/**
 * The budget category enum, derived from `BUDGET_CATEGORIES`.
 */
export const BudgetCategorySchema = z.enum(BUDGET_CATEGORIES);
/** The stable id of a budget category. */
export type BudgetCategoryId = z.infer<typeof BudgetCategorySchema>;

/**
 * Human-readable labels for each budget category.
 */
export const BUDGET_CATEGORY_LABELS: Record<BudgetCategoryId, string> = {
  venue: 'Venue & rentals',
  catering: 'Food & drink',
  photography: 'Photography & film',
  decor: 'Decor, flowers & lighting',
  music: 'Music & sound',
  attire: 'Attire & styling',
  transport: 'Transport & logistics',
  stationery: 'Stationery & signage',
  entertainment: 'Entertainment & activities',
  officiant: 'Ceremony & officiant',
  accommodation: 'Guest accommodation',
  gifts: 'Gifts & favours',
};

/**
 * The vendor categories a plan can track, in display order.
 */
export const VENDOR_CATEGORIES = [
  'venue',
  'caterer',
  'photographer',
  'decorator',
  'music',
  'attire',
  'transport',
  'stationery',
  'officiant',
  'accommodation',
  'gifts',
] as const;
/**
 * The vendor category enum, derived from `VENDOR_CATEGORIES`.
 */
export const VendorCategorySchema = z.enum(VENDOR_CATEGORIES);
/** The stable id of a vendor category. */
export type VendorCategoryId = z.infer<typeof VendorCategorySchema>;

/**
 * Human-readable labels for each vendor category.
 */
export const VENDOR_CATEGORY_LABELS: Record<VendorCategoryId, string> = {
  venue: 'Venue',
  caterer: 'Caterer',
  photographer: 'Photographer',
  decorator: 'Decor & flowers',
  music: 'Music / DJ',
  attire: 'Attire & styling',
  transport: 'Transport',
  stationery: 'Stationery & signage',
  officiant: 'Officiant / ceremony lead',
  accommodation: 'Guest accommodation',
  gifts: 'Gifts & favours',
};

/**
 * The stages a vendor moves through, from first contact to booked or passed.
 */
export const VENDOR_STATUSES = ['to_contact', 'contacted', 'quoted', 'booked', 'declined'] as const;
/**
 * The vendor status enum, derived from `VENDOR_STATUSES`.
 */
export const VendorStatusSchema = z.enum(VENDOR_STATUSES);
/** The booking state of a vendor. */
export type VendorStatus = z.infer<typeof VendorStatusSchema>;

/**
 * Human-readable labels for each vendor status.
 */
export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  to_contact: 'To contact',
  contacted: 'Contacted',
  quoted: 'Quote received',
  booked: 'Booked',
  declined: 'Passed',
};

/**
 * The areas a checklist task can belong to.
 */
export const TASK_AREAS = [
  'budget',
  'timeline',
  'vendors',
  'catering',
  'guest-experience',
  'accessibility',
  'sustainability',
  'logistics',
  'general',
] as const;
/**
 * The task area enum, derived from `TASK_AREAS`.
 */
export const TaskAreaSchema = z.enum(TASK_AREAS);
/** The planning area a task belongs to. */
export type TaskArea = z.infer<typeof TaskAreaSchema>;
