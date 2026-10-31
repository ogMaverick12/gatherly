import { describe, expect, it } from 'vitest';
import {
  addDays,
  compareDateOnly,
  diffDays,
  formatDateOnly,
  isValidDateOnly,
  monthOf,
  parseDateOnly,
  toDateOnly,
  todayDateOnly,
} from '@/lib/dates';

describe('date-only helpers', () => {
  it('validates calendar dates', () => {
    expect(isValidDateOnly('2026-12-05')).toBe(true);
    expect(isValidDateOnly('2026-02-30')).toBe(false);
    expect(isValidDateOnly('2026-13-01')).toBe(false);
    expect(isValidDateOnly('5/12/2026')).toBe(false);
    expect(isValidDateOnly('')).toBe(false);
  });

  it('parses a date without a timezone shift', () => {
    const parsed = parseDateOnly('2026-12-05');
    expect(parsed.getUTCFullYear()).toBe(2026);
    expect(parsed.getUTCMonth()).toBe(11);
    expect(parsed.getUTCDate()).toBe(5);
  });

  it('refuses to parse an impossible date', () => {
    expect(() => parseDateOnly('2026-02-30')).toThrow(RangeError);
  });

  it('adds days across a month boundary', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('counts whole days between two dates', () => {
    expect(diffDays('2026-12-05', '2026-12-12')).toBe(7);
    expect(diffDays('2026-12-12', '2026-12-05')).toBe(-7);
    expect(diffDays('2026-12-05', '2026-12-05')).toBe(0);
  });

  it('compares dates as strings', () => {
    expect(compareDateOnly('2026-01-01', '2026-02-01')).toBe(-1);
    expect(compareDateOnly('2026-02-01', '2026-01-01')).toBe(1);
    expect(compareDateOnly('2026-02-01', '2026-02-01')).toBe(0);
  });

  it('round-trips a Date through a date-only string', () => {
    const date = new Date(Date.UTC(2026, 5, 7));
    expect(toDateOnly(date)).toBe('2026-06-07');
  });

  it('uses local calendar fields for today', () => {
    const now = new Date(2026, 2, 14, 23, 30);
    expect(todayDateOnly(now)).toBe('2026-03-14');
  });

  it('reports the month as a number', () => {
    expect(monthOf('2026-06-07')).toBe(6);
  });

  it('formats a date for the reader', () => {
    expect(formatDateOnly('2026-12-05')).toContain('2026');
  });

  it('returns the raw value when the date is not valid', () => {
    expect(formatDateOnly('nope')).toBe('nope');
  });
});
