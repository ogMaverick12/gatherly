import { describe, expect, it } from 'vitest';
import { scoreQuote } from '@/features/vendors';
import { makeVendor as vendor } from '@tests/support/factories';

/** The earned points and explanation for one scored component. */
function component(vendorPatch: Parameters<typeof scoreQuote>[0], allocationMinor: number) {
  const assessment = scoreQuote(vendorPatch, allocationMinor, '2026-12-05');
  return assessment.components;
}

function earnedFor(
  vendorPatch: Parameters<typeof scoreQuote>[0],
  allocationMinor: number,
  id: string,
) {
  return component(vendorPatch, allocationMinor).find((part) => part.id === id);
}

describe('quote budget fit', () => {
  it('gives half credit when the category has no budget line yet', () => {
    const fit = earnedFor(vendor({ quotedMinor: 1_000_000 }), 0, 'budget-fit');

    expect(fit?.earned).toBe(15);
    expect(fit?.detail).toContain('No budget line');
  });
});

describe('quote lead time', () => {
  it('asks for the event date when a payment date is known', () => {
    const lead = scoreQuote(vendor({ dueDate: '2026-11-01' }), 1_000_000, null).components.find(
      (part) => part.id === 'lead-time',
    );

    expect(lead?.earned).toBe(12);
    expect(lead?.detail).toBe('Add the event date to measure lead time.');
  });

  it.each([
    ['2026-11-14', 25, '21 days before'],
    ['2026-11-21', 18, '14 days before'],
    ['2026-12-01', 10, '4 days before'],
    ['2026-12-10', 3, '5 days after'],
  ])('scores a payment due on %s with %i points', (dueDate, expected, detail) => {
    const lead = earnedFor(vendor({ dueDate }), 1_000_000, 'lead-time');

    expect(lead?.earned).toBe(expected);
    expect(lead?.detail).toContain(detail);
  });
});

describe('quote deposit terms', () => {
  it('gives partial credit when a booked vendor has no deposit recorded', () => {
    const deposit = earnedFor(
      vendor({ status: 'booked', depositMinor: null }),
      1_000_000,
      'deposit',
    );

    expect(deposit?.earned).toBe(5);
    expect(deposit?.detail).toContain('deposit is not recorded');
  });

  it('gives partial credit when a deposit has no full quote to compare', () => {
    const deposit = earnedFor(
      vendor({ status: 'booked', depositMinor: 100_000, quotedMinor: null }),
      1_000_000,
      'deposit',
    );

    expect(deposit?.earned).toBe(5);
    expect(deposit?.detail).toContain('no full quote');
  });

  it('gives no deposit credit when the full quote is zero', () => {
    const deposit = earnedFor(
      vendor({ status: 'booked', depositMinor: 100_000, quotedMinor: 0 }),
      1_000_000,
      'deposit',
    );

    expect(deposit?.earned).toBe(5);
    expect(deposit?.detail).toContain('no full quote');
  });

  it.each([
    [500_000, 250_000, 10, '50%'],
    [500_000, 300_000, 5, '60%'],
  ])('scores a deposit of %i/%i at %i points', (quote, depositMinor, expected, share) => {
    const deposit = earnedFor(
      vendor({ status: 'booked', quotedMinor: quote, depositMinor }),
      1_000_000,
      'deposit',
    );

    expect(deposit?.earned).toBe(expected);
    expect(deposit?.detail).toContain(share);
  });
});
