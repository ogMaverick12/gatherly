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

export function vendorChecklist(eventType: EventType): readonly VendorCategoryId[] {
  return CHECKLIST[eventType];
}

export function missingVendorCategories(plan: Plan): VendorCategoryId[] {
  const present = new Set(plan.vendors.map((vendor) => vendor.category));
  return vendorChecklist(plan.intake.eventType).filter((category) => !present.has(category));
}
