import { diffDays, type DateOnly } from '@/lib/dates';
import type { Vendor } from '@/lib/plan';

/**
 * How a quote scores.
 *
 * Four components, 100 points: does it fit the budget line (30), is the quote
 * complete enough to compare (30), does it leave lead time before the event
 * (25), and are the deposit terms sane (15). The user sees every component and
 * the reason it earned what it did.
 */

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

/** Whether the quote fits the money set aside for its category. */
function budgetFit(vendor: Vendor, allocationMinor: number): ScoreComponent {
  const base = { id: 'budget-fit', label: 'Budget fit', max: 30 };
  if (vendor.quotedMinor === null) {
    return { ...base, earned: 0, detail: 'No quote recorded yet.' };
  }
  if (allocationMinor <= 0) {
    return {
      ...base,
      earned: 15,
      detail: 'No budget line for this category yet, so fit cannot be judged.',
    };
  }
  const ratio = vendor.quotedMinor <= allocationMinor ? 1 : allocationMinor / vendor.quotedMinor;
  return {
    ...base,
    earned: Math.round(30 * ratio),
    detail:
      vendor.quotedMinor <= allocationMinor
        ? 'The quote fits inside the budget line.'
        : 'The quote is above the budget line for this category.',
  };
}

/** Whether the vendor record holds what a comparison needs. */
function completeness(vendor: Vendor): ScoreComponent {
  const points = [
    vendor.quotedMinor !== null ? 12 : 0,
    vendor.dueDate !== null ? 8 : 0,
    vendor.notes.trim().length > 0 ? 6 : 0,
    vendor.name.trim().length > 0 ? 4 : 0,
  ];
  return {
    id: 'completeness',
    label: 'Quote completeness',
    earned: points.reduce((sum, value) => sum + value, 0),
    max: 30,
    detail: 'Price, date, notes and a name make a quote comparable.',
  };
}

/** Whether payment is due far enough ahead of the event. */
function leadTime(vendor: Vendor, eventDate: DateOnly | null): ScoreComponent {
  const base = { id: 'lead-time', label: 'Lead time', max: 25 };
  if (vendor.dueDate === null) {
    return { ...base, earned: 12, detail: 'No payment date recorded.' };
  }
  if (eventDate === null) {
    return { ...base, earned: 12, detail: 'Add the event date to measure lead time.' };
  }
  const days = diffDays(vendor.dueDate, eventDate);
  const earned = days >= 21 ? 25 : days >= 7 ? 18 : days >= 0 ? 10 : 3;
  return {
    ...base,
    earned,
    detail:
      days >= 0
        ? `Payment is due ${days} days before the event.`
        : `Payment is due ${Math.abs(days)} days after the event - that is a risk.`,
  };
}

/** How much of the quote the deposit asks for. */
function deposit(vendor: Vendor): ScoreComponent {
  const base = { id: 'deposit', label: 'Deposit terms', max: 15 };
  if (vendor.status !== 'booked') {
    return { ...base, earned: 0, detail: 'Nothing is booked yet, so there are no deposit terms.' };
  }
  if (vendor.depositMinor === null) {
    return { ...base, earned: 5, detail: 'Booked, but the deposit is not recorded.' };
  }
  if (vendor.quotedMinor === null || vendor.quotedMinor <= 0) {
    return { ...base, earned: 5, detail: 'A deposit is recorded but no full quote is.' };
  }
  const share = vendor.depositMinor / vendor.quotedMinor;
  const earned = share <= 0.3 ? 15 : share <= 0.5 ? 10 : 5;
  return { ...base, earned, detail: `The deposit is ${Math.round(share * 100)}% of the quote.` };
}

/** Score a vendor's quote out of 100, with the working behind each part. */
export function scoreQuote(
  vendor: Vendor,
  allocationMinor: number,
  eventDate: DateOnly | null,
): QuoteAssessment {
  const components: ScoreComponent[] = [
    budgetFit(vendor, allocationMinor),
    completeness(vendor),
    leadTime(vendor, eventDate),
    deposit(vendor),
  ];
  return { score: components.reduce((sum, component) => sum + component.earned, 0), components };
}
