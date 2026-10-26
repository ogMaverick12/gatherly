import { diffDays, type DateOnly } from '@/lib/dates';
import type { Vendor } from '@/lib/plan';

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
