import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  allocateByWeight,
  formatMinor,
  formatMinorPlain,
  formatMoney,
  formatMoneyPlain,
  fromMajorUnits,
  minorUnitFactor,
  roundMinor,
  sharePercent,
  sumMinor,
  toMajorUnits,
} from '@/lib/money';

describe('minor units', () => {
  it('keeps money in integer minor units', () => {
    expect(fromMajorUnits(1234.56, 'INR')).toBe(123_456);
    expect(toMajorUnits(123_456, 'INR')).toBe(1234.56);
  });

  it('handles a zero-decimal currency', () => {
    expect(minorUnitFactor('JPY')).toBe(1);
    expect(fromMajorUnits(1500, 'JPY')).toBe(1500);
  });

  it('rounds to the nearest minor unit', () => {
    expect(roundMinor(10.4)).toBe(10);
    expect(roundMinor(10.5)).toBe(11);
    expect(roundMinor(-10.5)).toBe(-11);
  });
});

describe('sharePercent', () => {
  it('returns a percentage to one decimal place', () => {
    expect(sharePercent(1, 3)).toBe(33.3);
    expect(sharePercent(1, 4)).toBe(25);
  });

  it('is zero when the total is zero rather than NaN', () => {
    expect(sharePercent(10, 0)).toBe(0);
  });
});

describe('allocateByWeight', () => {
  it('splits the total so the parts sum to exactly the total', () => {
    const total = 100_000;
    const parts = allocateByWeight(total, [26, 27, 11, 10, 5, 4, 3, 2, 2, 4, 4, 2]);
    expect(sumMinor(parts)).toBe(total);
  });

  it('is stable for identical inputs', () => {
    const a = allocateByWeight(1000, [1, 1, 1]);
    const b = allocateByWeight(1000, [1, 1, 1]);
    expect(a).toEqual(b);
  });

  it('gives everything to a single weight', () => {
    expect(allocateByWeight(500, [7])).toEqual([500]);
  });

  it('returns zeros when every weight is zero', () => {
    expect(allocateByWeight(500, [0, 0])).toEqual([0, 0]);
  });

  it('ignores negative weights', () => {
    expect(allocateByWeight(100, [-5, 1])).toEqual([0, 100]);
  });

  it('handles an empty weight list', () => {
    expect(allocateByWeight(100, [])).toEqual([]);
  });
});

describe('formatting', () => {
  it('formats minor units as currency', () => {
    expect(formatMinor(123_456, 'INR')).toContain('1,234.56');
  });

  it('formats a zero-decimal currency without decimals', () => {
    expect(formatMinor(1500, 'JPY')).toContain('1,500');
  });

  it('formats a plain number without a symbol', () => {
    expect(formatMinorPlain(123_456, 'INR')).toBe('1,234.56');
  });

  it('groups INR in the Indian style with whole rupees', () => {
    expect(formatMoney(150_000_000, 'INR')).toBe('₹15,00,000');
    expect(formatMoney(833_333, 'INR')).toBe('₹8,333');
    expect(formatMoney(37_636_364, 'INR')).toBe('₹3,76,364');
  });

  it('keeps other currencies on their existing formatter', () => {
    expect(formatMoney(123_456, 'USD')).toBe(formatMinor(123_456, 'USD'));
  });

  it('uses Indian grouping for plain INR display too', () => {
    expect(formatMoneyPlain(150_000_000, 'INR')).toBe('15,00,000');
    expect(formatMoneyPlain(123_456, 'USD')).toBe(formatMinorPlain(123_456, 'USD'));
  });

  it('never shows an INR amount more than half a rupee from the stored value', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100_000_000_000 }), (minor) => {
        const shown = Number(formatMoney(minor, 'INR').replace(/[^\d.-]/g, ''));
        return Math.abs(shown - minor / 100) <= 0.5;
      }),
    );
  });
});
