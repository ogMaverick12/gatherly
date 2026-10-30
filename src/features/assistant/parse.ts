/**
 * The free-text intake parser.
 *
 * It matches only the published keyword tables and returns null for anything
 * it did not read, so an unrecognised phrase never becomes a plan value.
 */

import type { ParsedFields } from '@/lib/api-schema';
import { isValidDateOnly } from '@/lib/dates';
import { fromMajorUnits } from '@/lib/money';
import {
  ACCESS_NEEDS,
  DIETARY_NEEDS,
  PRIORITIES,
  type CityTier,
  type Currency,
  type DietaryNeed,
  type EventType,
  type Priority,
} from '@/lib/plan';
import {
  ACCESS_WORDS,
  CURRENCY_KEYWORDS,
  DIETARY_WORDS,
  EVENT_TYPE_KEYWORDS,
  MONTHS,
  PRIORITY_WORDS,
  TIER_KEYWORDS,
} from './parse-keywords';

function matchFirst<T>(
  text: string,
  table: readonly { value: T; words: readonly string[] }[],
): T | null {
  for (const entry of table) {
    for (const word of entry.words) {
      if (text.includes(word)) return entry.value;
    }
  }
  return null;
}

function matchAll<T>(text: string, table: readonly { value: T; words: readonly string[] }[]): T[] {
  const found: T[] = [];
  for (const entry of table) {
    for (const word of entry.words) {
      if (text.includes(word)) {
        if (!found.includes(entry.value)) found.push(entry.value);
        break;
      }
    }
  }
  return found;
}

/** Read an ISO `YYYY-MM-DD` date. */
function parseIsoDate(text: string): string | null {
  const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (!iso) return null;
  const candidate = `${iso[1]}-${iso[2]}-${iso[3]}`;
  return isValidDateOnly(candidate) ? candidate : null;
}

/** Read a `DD/MM/YYYY` date. */
function parseSlashDate(text: string): string | null {
  const slash = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(text);
  if (!slash) return null;
  const day = slash[1]?.padStart(2, '0');
  const month = slash[2]?.padStart(2, '0');
  const year = slash[3];
  if (!day || !month || !year) return null;
  const candidate = `${year}-${month}-${day}`;
  return isValidDateOnly(candidate) ? candidate : null;
}

/** Read a `DD Month YYYY` date. */
function parseDayMonth(text: string): string | null {
  const dayMonth = /(\d{1,2})\s+([a-z]+)\s+(\d{4})/i.exec(text);
  if (!dayMonth) return null;
  const day = dayMonth[1]?.padStart(2, '0');
  const monthName = (dayMonth[2] ?? '').toLowerCase();
  const year = dayMonth[3];
  const month = MONTHS.find((entry) => entry.name === monthName)?.index;
  if (!day || !month || !year) return null;
  const candidate = `${year}-${String(month).padStart(2, '0')}-${day}`;
  return isValidDateOnly(candidate) ? candidate : null;
}

/** Read a `Month DD, YYYY` date. */
function parseMonthDay(text: string): string | null {
  const monthDay = /([a-z]+)\s+(\d{1,2}),?\s+(\d{4})/i.exec(text);
  if (!monthDay) return null;
  const monthName = (monthDay[1] ?? '').toLowerCase();
  const day = monthDay[2]?.padStart(2, '0');
  const year = monthDay[3];
  const month = MONTHS.find((entry) => entry.name === monthName)?.index;
  if (!day || !month || !year) return null;
  const candidate = `${year}-${String(month).padStart(2, '0')}-${day}`;
  return isValidDateOnly(candidate) ? candidate : null;
}

/** Read the first valid date in any of the supported formats. */
function parseEventDate(text: string): string | null {
  return parseIsoDate(text) ?? parseSlashDate(text) ?? parseDayMonth(text) ?? parseMonthDay(text);
}

function parseGuests(text: string): number | null {
  const match =
    /(\d[\d,]{0,9})\s*(?:guests?|people|persons?|attendees|pax)/i.exec(text) ??
    /(?:about|around|roughly|approximately|~)?\s*(\d[\d,]{0,9})\s*(?:of us|people coming)/i.exec(
      text,
    );
  if (!match?.[1]) return null;
  const value = Number(match[1].replace(/,/g, ''));
  if (!Number.isFinite(value) || value < 1 || value > 5000) return null;
  return Math.round(value);
}

function parseBudget(text: string): { currency: Currency; amountMinor: number } | null {
  for (const entry of CURRENCY_KEYWORDS) {
    for (const word of entry.words) {
      const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const match = new RegExp(`${escaped}\\s*([\\d][\\d,]{0,12})`, 'i').exec(text);
      if (match?.[1]) {
        const major = Number(match[1].replace(/,/g, ''));
        if (Number.isFinite(major) && major > 0 && major < 100_000_000) {
          return { currency: entry.value, amountMinor: fromMajorUnits(major, entry.value) };
        }
      }
    }
  }

  const currency = matchFirst<Currency>(text, CURRENCY_KEYWORDS);
  if (currency) {
    const match = /budget[^0-9]{0,20}([\d][\d,]{0,12})/i.exec(text);
    if (match?.[1]) {
      const major = Number(match[1].replace(/,/g, ''));
      if (Number.isFinite(major) && major > 0 && major < 100_000_000) {
        return { currency, amountMinor: fromMajorUnits(major, currency) };
      }
    }
  }

  return null;
}

/**
 * Reads what it can from a sentence typed by the user.
 * @param input the raw sentence; dates may be ISO, `DD/MM/YYYY` or month-name forms
 * @returns whichever fields were recognised: an ISO date `YYYY-MM-DD`, a whole guest count,
 * budget in integer minor units (paise, cents) and up to four priorities
 */
export function parseFreeText(input: string): ParsedFields {
  const text = input.toLowerCase();

  const eventType = matchFirst<EventType>(text, EVENT_TYPE_KEYWORDS);
  const cityTier = matchFirst<CityTier>(text, TIER_KEYWORDS);
  const eventDate = parseEventDate(input);
  const guests = parseGuests(text);
  const budget = parseBudget(text);

  const priorities = matchAll<Priority>(text, PRIORITY_WORDS).filter((priority) =>
    PRIORITIES.includes(priority),
  );
  const dietary = matchAll<DietaryNeed>(text, DIETARY_WORDS).filter((need) =>
    DIETARY_NEEDS.includes(need),
  );
  const access = matchAll<string>(text, ACCESS_WORDS).filter((need) =>
    (ACCESS_NEEDS as readonly string[]).includes(need),
  );

  return {
    eventType,
    eventDate,
    guests,
    cityTier,
    currency: budget?.currency ?? null,
    budgetMinor: budget?.amountMinor ?? null,
    priorities: priorities.slice(0, 4),
    dietary: dietary.slice(0, 12),
    access: access.slice(0, 12),
    notes: input.trim().slice(0, 1000),
  };
}
