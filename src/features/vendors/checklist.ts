import {
  type BudgetCategoryId,
  type EventType,
  type Plan,
  type VendorCategoryId,
} from '@/lib/plan';

/**
 * Which vendors an event of each type needs, and which budget line each
 * vendor's quote belongs to.
 */

/** Maps each vendor category to the budget line its quote is counted against. */
export const VENDOR_CATEGORY_BUDGET_LINE: Record<VendorCategoryId, BudgetCategoryId> = {
  venue: 'venue',
  caterer: 'catering',
  photographer: 'photography',
  decorator: 'decor',
  music: 'music',
  attire: 'attire',
  transport: 'transport',
  stationery: 'stationery',
  officiant: 'officiant',
  accommodation: 'accommodation',
  gifts: 'gifts',
};

const CHECKLIST: Record<EventType, readonly VendorCategoryId[]> = {
  wedding: [
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
  ],
  birthday: [
    'venue',
    'caterer',
    'photographer',
    'decorator',
    'music',
    'transport',
    'stationery',
    'gifts',
  ],
  community: [
    'venue',
    'caterer',
    'decorator',
    'music',
    'transport',
    'stationery',
    'officiant',
    'gifts',
  ],
};

/**
 * Lists the vendor categories an event type is expected to cover.
 * @param eventType the event type whose checklist is read
 * @returns the category ids in the order the checklist shows them
 */
export function vendorChecklist(eventType: EventType): readonly VendorCategoryId[] {
  return CHECKLIST[eventType];
}

/**
 * Finds the checklist categories the plan has no vendor for yet.
 * @param plan the stored plan whose event type and vendors are compared
 * @returns category ids with no matching vendor, in checklist order
 */
export function missingVendorCategories(plan: Plan): VendorCategoryId[] {
  const present = new Set(plan.vendors.map((vendor) => vendor.category));
  return vendorChecklist(plan.intake.eventType).filter((category) => !present.has(category));
}
