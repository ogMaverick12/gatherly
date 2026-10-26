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
export const BudgetCategorySchema = z.enum(BUDGET_CATEGORIES);
export type BudgetCategoryId = z.infer<typeof BudgetCategorySchema>;

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
export const VendorCategorySchema = z.enum(VENDOR_CATEGORIES);
export type VendorCategoryId = z.infer<typeof VendorCategorySchema>;

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

export const VENDOR_STATUSES = ['to_contact', 'contacted', 'quoted', 'booked', 'declined'] as const;
export const VendorStatusSchema = z.enum(VENDOR_STATUSES);
export type VendorStatus = z.infer<typeof VendorStatusSchema>;

export const VENDOR_STATUS_LABELS: Record<VendorStatus, string> = {
  to_contact: 'To contact',
  contacted: 'Contacted',
  quoted: 'Quote received',
  booked: 'Booked',
  declined: 'Passed',
};

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
export const TaskAreaSchema = z.enum(TASK_AREAS);
export type TaskArea = z.infer<typeof TaskAreaSchema>;
