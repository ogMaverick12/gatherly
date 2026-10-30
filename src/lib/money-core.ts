import { CURRENCY_META, type Currency } from './plan';

/**
 * Money arithmetic.
 *
 * Gatherly stores every amount as an integer number of minor units (paise,
 * cents, ...) and always pairs it with its currency. Nothing in this module
 * converts between currencies: a plan has exactly one currency for its life.
 */

/**
 * The number of minor units in one major unit for a currency.
 *
 * @param currency the plan's currency
 * @returns 100 for paise and cents, 1 for zero-decimal currencies such as JPY
 * @example
 * minorUnitFactor('INR'); // 100
 */
export function minorUnitFactor(currency: Currency): number {
  return 10 ** CURRENCY_META[currency].minorUnits;
}

/**
 * Convert integer minor units to major units for display or input.
 *
 * @param minor integer minor units (paise, cents, ...)
 * @param currency the plan's currency, which sets the minor-unit factor
 * @returns the amount in major units, not rounded
 * @example
 * toMajorUnits(150_000, 'INR'); // 1500
 */
export function toMajorUnits(minor: number, currency: Currency): number {
  return minor / minorUnitFactor(currency);
}

/**
 * Convert a major-unit amount to integer minor units.
 * Rounds to the nearest minor unit, so the result is deterministic.
 *
 * @param major the amount in major units, e.g. rupees or dollars
 * @param currency the plan's currency, which sets the minor-unit factor
 * @returns integer minor units (paise, cents, ...)
 * @example
 * fromMajorUnits(1499.5, 'INR'); // 149950
 */
export function fromMajorUnits(major: number, currency: Currency): number {
  return Math.round(major * minorUnitFactor(currency));
}

/**
 * Add amounts that are all in the same currency's minor units.
 *
 * @param values integer minor units (paise, cents, ...)
 * @returns the total in the same minor units
 * @example
 * sumMinor([125_000, 75_000]); // 200000
 */
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

/**
 * Split an amount across weights so the parts sum exactly to the total.
 * The remainder is given to the largest share, with ties broken by the
 * caller's ordering, so the result is stable for identical inputs.
 *
 * @param total integer minor units (paise, cents, ...) to split
 * @param weights relative shares; negative weights count as zero
 * @returns one integer amount per weight, summing exactly to `total`
 * @example
 * allocateByWeight(1000, [1, 1, 1]); // [334, 333, 333]
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
