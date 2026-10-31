import { z } from 'zod';

/**
 * Currencies and their minor-unit metadata.
 *
 * Money is always stored as an integer number of minor units and always
 * carries its currency. Gatherly never converts between currencies, so a
 * plan can never mix two.
 */

export const CURRENCIES = [
  'INR',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'NGN',
  'IDR',
  'BRL',
  'ZAR',
  'AUD',
  'CAD',
  'SGD',
  'KES',
  'PHP',
  'MXN',
  'NPR',
  'BDT',
  'PKR',
  'LKR',
  'JPY',
] as const;
/**
 * The currency enum, derived from `CURRENCIES`.
 */
export const CurrencySchema = z.enum(CURRENCIES);
/** A supported currency code. */
export type Currency = z.infer<typeof CurrencySchema>;

/** Formatting metadata for one currency. */
export interface CurrencyMeta {
  readonly code: Currency;
  readonly minorUnits: 0 | 2;
  readonly symbol: string;
  readonly label: string;
}

/**
 * Decimal places, symbol and label for every supported currency.
 */
export const CURRENCY_META: Record<Currency, CurrencyMeta> = {
  INR: { code: 'INR', minorUnits: 2, symbol: '₹', label: 'Indian rupee' },
  USD: { code: 'USD', minorUnits: 2, symbol: '$', label: 'US dollar' },
  EUR: { code: 'EUR', minorUnits: 2, symbol: '€', label: 'Euro' },
  GBP: { code: 'GBP', minorUnits: 2, symbol: '£', label: 'Pound sterling' },
  AED: { code: 'AED', minorUnits: 2, symbol: 'د.إ', label: 'UAE dirham' },
  NGN: { code: 'NGN', minorUnits: 2, symbol: '₦', label: 'Nigerian naira' },
  IDR: { code: 'IDR', minorUnits: 2, symbol: 'Rp', label: 'Indonesian rupiah' },
  BRL: { code: 'BRL', minorUnits: 2, symbol: 'R$', label: 'Brazilian real' },
  ZAR: { code: 'ZAR', minorUnits: 2, symbol: 'R', label: 'South African rand' },
  AUD: { code: 'AUD', minorUnits: 2, symbol: 'A$', label: 'Australian dollar' },
  CAD: { code: 'CAD', minorUnits: 2, symbol: 'C$', label: 'Canadian dollar' },
  SGD: { code: 'SGD', minorUnits: 2, symbol: 'S$', label: 'Singapore dollar' },
  KES: { code: 'KES', minorUnits: 2, symbol: 'KSh', label: 'Kenyan shilling' },
  PHP: { code: 'PHP', minorUnits: 2, symbol: '₱', label: 'Philippine peso' },
  MXN: { code: 'MXN', minorUnits: 2, symbol: 'MX$', label: 'Mexican peso' },
  NPR: { code: 'NPR', minorUnits: 2, symbol: '₨', label: 'Nepalese rupee' },
  BDT: { code: 'BDT', minorUnits: 2, symbol: '৳', label: 'Bangladeshi taka' },
  PKR: { code: 'PKR', minorUnits: 2, symbol: '₨', label: 'Pakistani rupee' },
  LKR: { code: 'LKR', minorUnits: 2, symbol: 'Rs', label: 'Sri Lankan rupee' },
  JPY: { code: 'JPY', minorUnits: 0, symbol: '¥', label: 'Japanese yen' },
};
