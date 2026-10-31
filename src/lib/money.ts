import { CURRENCY_META, type Currency } from './plan';
import { minorUnitFactor } from './money-core';

export {
  allocateByWeight,
  fromMajorUnits,
  minorUnitFactor,
  roundMinor,
  sharePercent,
  sumMinor,
  toMajorUnits,
} from './money-core';

/**
 * Money formatting.
 *
 * Gatherly stores every amount as an integer number of minor units (paise,
 * cents, ...) and always pairs it with its currency. Nothing in this module
 * converts between currencies: a plan has exactly one currency for its life.
 */

/**
 * Format minor units as a localised currency string.
 *
 * @param minor integer minor units (paise, cents, ...)
 * @param currency the currency to format in
 * @param locale BCP-47 locale tag used for grouping and symbols
 * @param options `compact` shortens large values; `maximumFractionDigits` caps decimals
 * @returns the formatted amount with its currency marker
 * @example
 * formatMinor(150_000, 'INR'); // '₹1,500'
 */
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

/**
 * Format minor units for display.
 *
 * INR uses Indian digit grouping and whole rupees, because paise are never
 * useful in a planning figure. Every other currency keeps its existing
 * currency formatter. Stored values and CSV exports stay in integer minor units.
 *
 * @param minor integer minor units (paise, cents, ...)
 * @param currency the currency to format in
 * @returns the amount with its currency marker, rounded for INR display
 * @example
 * formatMoney(150_000_000, 'INR'); // '₹15,00,000'
 */
export function formatMoney(minor: number, currency: Currency): string {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Math.round(minor / minorUnitFactor('INR')));
  }
  return formatMinor(minor, currency);
}

/**
 * Format minor units as a display number without a currency marker.
 * INR uses Indian grouping and whole rupees; other currencies keep their
 * existing plain formatter. CSV keeps using `formatMinorPlain` for exactness.
 *
 * @param minor integer minor units (paise, cents, ...)
 * @param currency the currency to format in
 * @returns the grouped number without a currency symbol
 * @example
 * formatMoneyPlain(150_000_000, 'INR'); // '15,00,000'
 */
export function formatMoneyPlain(minor: number, currency: Currency): string {
  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Math.round(minor / minorUnitFactor('INR')));
  }
  return formatMinorPlain(minor, currency);
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
