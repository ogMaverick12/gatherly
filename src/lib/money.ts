import { CURRENCY_META, type Currency } from './plan';

/**
 * Money helpers.
 *
 * Gatherly stores every amount as an integer number of minor units (paise,
 * cents, ...) and always pairs it with its currency. Nothing in this module
 * converts between currencies: a plan has exactly one currency for its life.
 */

export function minorUnitFactor(currency: Currency): number {
  return 10 ** CURRENCY_META[currency].minorUnits;
}

export function toMajorUnits(minor: number, currency: Currency): number {
  return minor / minorUnitFactor(currency);
}

export function fromMajorUnits(major: number, currency: Currency): number {
  return Math.round(major * minorUnitFactor(currency));
}

export function sumMinor(values: readonly number[]): number {
  let total = 0;
  for (const value of values) total += value;
  return total;
}

/** Round to a whole minor unit, away from zero on .5 (deterministic). */
export function roundMinor(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/** Percentage of `total` that `part` represents, rounded to one decimal. */
export function sharePercent(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

export function formatMinor(
  minor: number,
  currency: Currency,
  locale = 'en',
  options: { compact?: boolean; maximumFractionDigits?: number } = {},
): string {
  const factor = minorUnitFactor(currency);
  const amount = minor / factor;
  const maximumFractionDigits = options.maximumFractionDigits ?? CURRENCY_META[currency].minorUnits;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: options.compact ? 'compact' : 'standard',
    maximumFractionDigits,
    minimumFractionDigits: options.compact ? 0 : 0,
  }).format(amount);
}

/** Plain number without a currency symbol, for table cells and CSV. */
export function formatMinorPlain(
  minor: number,
  currency: Currency,
  locale = 'en',
  options: { compact?: boolean } = {},
): string {
  const factor = minorUnitFactor(currency);
  const amount = minor / factor;
  return new Intl.NumberFormat(locale, {
    notation: options.compact ? 'compact' : 'standard',
    maximumFractionDigits: CURRENCY_META[currency].minorUnits,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function currencySymbol(currency: Currency): string {
  return CURRENCY_META[currency].symbol;
}

/**
 * Split an amount across weights so the parts sum exactly to the total.
 * The remainder is given to the largest share, with ties broken by the
 * caller's ordering, so the result is stable for identical inputs.
 */
export function allocateByWeight(total: number, weights: readonly number[]): number[] {
  const weightTotal = weights.reduce((sum, weight) => sum + Math.max(0, weight), 0);
  if (weightTotal === 0 || weights.length === 0) {
    return weights.map(() => 0);
  }

  const raw = weights.map((weight) => (total * Math.max(0, weight)) / weightTotal);
  const floored = raw.map((value) => Math.floor(value));
  let remainder = total - floored.reduce((sum, value) => sum + value, 0);

  const order = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  const result = [...floored];
  let cursor = 0;
  while (remainder > 0 && order.length > 0) {
    const target = order[cursor % order.length];
    if (target) {
      result[target.index] = (result[target.index] ?? 0) + 1;
      remainder -= 1;
    }
    cursor += 1;
    if (cursor > order.length * 4) break;
  }
  return result;
}
