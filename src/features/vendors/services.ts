import {
  VENDOR_CATEGORY_LABELS,
  type BudgetCategoryId,
  type EventType,
  type Plan,
  type Vendor,
  type VendorCategoryId,
  type VendorStatus,
} from '@/lib/plan';
import { diffDays, type DateOnly } from '@/lib/dates';
import { sharePercent } from '@/lib/money';

/**
 * Vendor engine.
 *
 * Keeps the checklist honest: it measures what is booked against what the
 * budget planned, scores a quote on explainable components, and never
 * invents a vendor, a price or an availability.
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

/* ------------------------------------------------------------------ *
 * Quote score
 * ------------------------------------------------------------------ */

export interface ScoreComponent {
  readonly id: string;
  readonly label: string;
  readonly earned: number;
  readonly max: number;
  readonly detail: string;
}

export interface QuoteAssessment {
  readonly score: number;
  readonly components: readonly ScoreComponent[];
}

export function scoreQuote(
  vendor: Vendor,
  allocationMinor: number,
  eventDate: DateOnly | null,
): QuoteAssessment {
  const components: ScoreComponent[] = [];

  // Budget fit (30).
  if (vendor.quotedMinor === null) {
    components.push({
      id: 'budget-fit',
      label: 'Budget fit',
      earned: 0,
      max: 30,
      detail: 'No quote recorded yet.',
    });
  } else if (allocationMinor <= 0) {
    components.push({
      id: 'budget-fit',
      label: 'Budget fit',
      earned: 15,
      max: 30,
      detail: 'No budget line for this category yet, so fit cannot be judged.',
    });
  } else {
    const ratio = vendor.quotedMinor <= allocationMinor ? 1 : allocationMinor / vendor.quotedMinor;
    components.push({
      id: 'budget-fit',
      label: 'Budget fit',
      earned: Math.round(30 * ratio),
      max: 30,
      detail:
        vendor.quotedMinor <= allocationMinor
          ? 'The quote fits inside the budget line.'
          : 'The quote is above the budget line for this category.',
    });
  }

  // Completeness (30).
  const completenessPoints = [
    vendor.quotedMinor !== null ? 12 : 0,
    vendor.dueDate !== null ? 8 : 0,
    vendor.notes.trim().length > 0 ? 6 : 0,
    vendor.name.trim().length > 0 ? 4 : 0,
  ];
  const completeness = completenessPoints.reduce((sum, value) => sum + value, 0);
  components.push({
    id: 'completeness',
    label: 'Quote completeness',
    earned: completeness,
    max: 30,
    detail: 'Price, date, notes and a name make a quote comparable.',
  });

  // Lead time (25).
  if (vendor.dueDate === null) {
    components.push({
      id: 'lead-time',
      label: 'Lead time',
      earned: 12,
      max: 25,
      detail: 'No payment date recorded.',
    });
  } else if (eventDate === null) {
    components.push({
      id: 'lead-time',
      label: 'Lead time',
      earned: 12,
      max: 25,
      detail: 'Add the event date to measure lead time.',
    });
  } else {
    const days = diffDays(vendor.dueDate, eventDate);
    const earned = days >= 21 ? 25 : days >= 7 ? 18 : days >= 0 ? 10 : 3;
    components.push({
      id: 'lead-time',
      label: 'Lead time',
      earned,
      max: 25,
      detail:
        days >= 0
          ? `Payment is due ${days} days before the event.`
          : `Payment is due ${Math.abs(days)} days after the event - that is a risk.`,
    });
  }

  // Deposit terms (15).
  if (vendor.status !== 'booked') {
    components.push({
      id: 'deposit',
      label: 'Deposit terms',
      earned: 0,
      max: 15,
      detail: 'Nothing is booked yet, so there are no deposit terms.',
    });
  } else if (vendor.depositMinor === null) {
    components.push({
      id: 'deposit',
      label: 'Deposit terms',
      earned: 5,
      max: 15,
      detail: 'Booked, but the deposit is not recorded.',
    });
  } else if (vendor.quotedMinor !== null && vendor.quotedMinor > 0) {
    const share = vendor.depositMinor / vendor.quotedMinor;
    const earned = share <= 0.3 ? 15 : share <= 0.5 ? 10 : 5;
    components.push({
      id: 'deposit',
      label: 'Deposit terms',
      earned,
      max: 15,
      detail: `The deposit is ${Math.round(share * 100)}% of the quote.`,
    });
  } else {
    components.push({
      id: 'deposit',
      label: 'Deposit terms',
      earned: 5,
      max: 15,
      detail: 'A deposit is recorded but no full quote is.',
    });
  }

  const score = components.reduce((sum, component) => sum + component.earned, 0);
  return { score, components };
}

/* ------------------------------------------------------------------ *
 * Coverage
 * ------------------------------------------------------------------ */

export interface CategoryCoverage {
  readonly category: VendorCategoryId;
  readonly label: string;
  readonly allocatedMinor: number;
  readonly quotedMinor: number;
  readonly bookedMinor: number;
  readonly coveragePercent: number;
  readonly status: VendorStatus | 'not-started';
  readonly hasVendor: boolean;
}

export interface VendorCoverage {
  readonly categories: readonly CategoryCoverage[];
  readonly overallPercent: number;
  readonly allocatedMinor: number;
  readonly bookedMinor: number;
  readonly quotedMinor: number;
  readonly outstandingCount: number;
  readonly nextAction: string | null;
}

export function computeVendorCoverage(
  plan: Plan,
  allocationByCategory: Readonly<Record<BudgetCategoryId, number>>,
): VendorCoverage {
  const categories: CategoryCoverage[] = vendorChecklist(plan.intake.eventType).map((category) => {
    const budgetLine = VENDOR_CATEGORY_BUDGET_LINE[category];
    const allocatedMinor = allocationByCategory[budgetLine] ?? 0;
    const vendors = plan.vendors.filter((vendor) => vendor.category === category);
    const quotedMinor = vendors.reduce((sum, vendor) => sum + (vendor.quotedMinor ?? 0), 0);
    const bookedMinor = vendors
      .filter((vendor) => vendor.status === 'booked')
      .reduce((sum, vendor) => sum + (vendor.quotedMinor ?? vendor.depositMinor ?? 0), 0);
    const status = vendors.some((vendor) => vendor.status === 'booked')
      ? 'booked'
      : vendors.some((vendor) => vendor.status === 'quoted')
        ? 'quoted'
        : vendors.some((vendor) => vendor.status === 'contacted')
          ? 'contacted'
          : vendors.some((vendor) => vendor.status === 'to_contact')
            ? 'to_contact'
            : 'not-started';
    const coveragePercent =
      allocatedMinor > 0
        ? Math.min(100, Math.round((bookedMinor / allocatedMinor) * 100))
        : bookedMinor > 0
          ? 100
          : 0;
    return {
      category,
      label: VENDOR_CATEGORY_LABELS[category],
      allocatedMinor,
      quotedMinor,
      bookedMinor,
      coveragePercent,
      status,
      hasVendor: vendors.length > 0,
    };
  });

  const allocatedMinor = categories.reduce((sum, item) => sum + item.allocatedMinor, 0);
  const bookedMinor = categories.reduce((sum, item) => sum + item.bookedMinor, 0);
  const quotedMinor = categories.reduce((sum, item) => sum + item.quotedMinor, 0);
  const coveredMinor = categories.reduce(
    (sum, item) => sum + Math.min(item.bookedMinor, item.allocatedMinor),
    0,
  );
  const overallPercent = allocatedMinor > 0 ? Math.round((coveredMinor / allocatedMinor) * 100) : 0;

  const outstanding = plan.vendors.filter(
    (vendor) => vendor.status !== 'booked' && vendor.status !== 'declined',
  );

  return {
    categories,
    overallPercent,
    allocatedMinor,
    bookedMinor,
    quotedMinor,
    outstandingCount: outstanding.length,
    nextAction: outstanding[0]?.name
      ? `Follow up with ${outstanding[0].name || VENDOR_CATEGORY_LABELS[outstanding[0].category]}`
      : outstanding.length > 0
        ? `Contact the next vendor: ${VENDOR_CATEGORY_LABELS[outstanding[0]?.category ?? 'venue']}`
        : null,
  };
}

/* ------------------------------------------------------------------ *
 * WhatsApp deep link
 * ------------------------------------------------------------------ */

/**
 * Normalise a phone number to digits for a wa.me deep link.
 * Returns null when the number cannot be used, so the UI can offer a
 * copyable message instead of a link that goes nowhere.
 */
export function normalisePhone(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith('+');
  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('00')) {
    digits = digits.slice(2);
    return digits.length >= 8 ? `+${digits}` : null;
  }
  if (!digits) return null;
  if (digits.length < 8 || digits.length > 15) return null;
  return hasPlus ? `+${digits}` : digits;
}

export interface WhatsAppLink {
  readonly href: string | null;
  readonly message: string;
  readonly reason: string | null;
}

export function buildWhatsAppLink(vendor: Vendor, eventLabel: string): WhatsAppLink {
  const message = `Hello ${vendor.name || 'there'}, I am planning ${eventLabel} and would love to ask about your availability and pricing.`;
  const phone = normalisePhone(vendor.phone);
  if (!phone) {
    return {
      href: null,
      message,
      reason: vendor.phone.trim()
        ? 'That number does not look complete yet, so there is no link to open.'
        : 'Add a phone number to open a chat.',
    };
  }
  return {
    href: `https://wa.me/${phone.replace('+', '')}?text=${encodeURIComponent(message)}`,
    message,
    reason: null,
  };
}

/* ------------------------------------------------------------------ *
 * Status helpers
 * ------------------------------------------------------------------ */

/**
 * The order a vendor moves through as the booking progresses.
 * "declined" is not part of it: a vendor you pass is not "one step further".
 */
export const STATUS_ORDER: readonly VendorStatus[] = [
  'to_contact',
  'contacted',
  'quoted',
  'booked',
];

export function nextStatus(status: VendorStatus): VendorStatus {
  if (status === 'declined') return 'to_contact';
  const index = STATUS_ORDER.indexOf(status);
  if (index < 0) return 'to_contact';
  return STATUS_ORDER[Math.min(index + 1, STATUS_ORDER.length - 1)] ?? 'to_contact';
}

export function vendorCoverageShare(coverage: VendorCoverage, category: VendorCategoryId): number {
  const found = coverage.categories.find((item) => item.category === category);
  return found ? sharePercent(found.bookedMinor, found.allocatedMinor) : 0;
}
