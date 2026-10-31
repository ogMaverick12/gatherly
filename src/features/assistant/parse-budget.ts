/**
 * Budget readers for the free-text intake parser.
 *
 * A budget is only read beside a published currency word, or after "budget".
 */

import { fromMajorUnits } from '@/lib/money';
import type { Currency } from '@/lib/plan';
import { CURRENCY_KEYWORDS } from './parse-keywords';
import { matchFirst } from './parse-match';

/** Budgets at or above this many major units are rejected. */
const MAX_BUDGET_MAJOR_EXCLUSIVE = 100_000_000;

/** Extra digits allowed after the first digit of a budget amount. */
const MAX_BUDGET_EXTRA_DIGITS = 12;

/** A budget amount: one digit followed by up to twelve digits or commas. */
const BUDGET_AMOUNT_PATTERN = `[\\d][\\d,]{0,${MAX_BUDGET_EXTRA_DIGITS}}`;

/**
 * Read and range-check a comma-grouped amount in major units.
 *
 * @param text the captured digits and commas
 * @returns the amount, or null when it is empty, non-finite or out of range
 */
function parseMajorAmount(text: string): number | null {
  const major = Number(text.replace(/,/g, ''));
  return Number.isFinite(major) && major > 0 && major < MAX_BUDGET_MAJOR_EXCLUSIVE ? major : null;
}

/** Read a captured amount, if the expression matched one. */
function amountFromMatch(match: RegExpExecArray | null): number | null {
  return match?.[1] ? parseMajorAmount(match[1]) : null;
}

/** Read the first amount written next to a currency word. */
function parseCurrencyAmount(
  text: string,
  entry: { value: Currency; words: readonly string[] },
): { currency: Currency; amountMinor: number } | null {
  for (const word of entry.words) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const major = amountFromMatch(
      new RegExp(`${escaped}\\s*(${BUDGET_AMOUNT_PATTERN})`, 'i').exec(text),
    );
    if (major !== null) {
      return { currency: entry.value, amountMinor: fromMajorUnits(major, entry.value) };
    }
  }
  return null;
}

/**
 * Read a currency amount, either beside its word or after "budget".
 *
 * @param text the lower-cased input
 * @returns the currency and integer minor-unit amount, or null
 */
export function parseBudget(text: string): { currency: Currency; amountMinor: number } | null {
  for (const entry of CURRENCY_KEYWORDS) {
    const parsed = parseCurrencyAmount(text, entry);
    if (parsed) return parsed;
  }

  const currency = matchFirst<Currency>(text, CURRENCY_KEYWORDS);
  if (!currency) return null;

  const amountMinor = amountFromMatch(
    new RegExp(`budget[^0-9]{0,20}(${BUDGET_AMOUNT_PATTERN})`, 'i').exec(text),
  );
  return amountMinor === null
    ? null
    : { currency, amountMinor: fromMajorUnits(amountMinor, currency) };
}
