/**
 * Date readers for the free-text intake parser.
 *
 * Only the listed formats are recognised; a date that is not valid is ignored.
 */

import { isValidDateOnly } from '@/lib/dates';
import { MONTHS } from './parse-keywords';

/** One month-name date layout and the match groups holding its parts. */
interface MonthDateFormat {
  readonly pattern: RegExp;
  readonly dayGroup: number;
  readonly monthGroup: number;
  readonly yearGroup: number;
}

/** The two supported month-name layouts, read by one parser. */
const MONTH_DATE_FORMATS: Readonly<Record<'dayMonth' | 'monthDay', MonthDateFormat>> = {
  dayMonth: {
    pattern: /(\d{1,2})\s+([a-z]+)\s+(\d{4})/i,
    dayGroup: 1,
    monthGroup: 2,
    yearGroup: 3,
  },
  monthDay: {
    pattern: /([a-z]+)\s+(\d{1,2}),?\s+(\d{4})/i,
    dayGroup: 2,
    monthGroup: 1,
    yearGroup: 3,
  },
};

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

/** Read a date in one of the month-name layouts. */
function parseMonthDate(text: string, format: MonthDateFormat): string | null {
  const match = format.pattern.exec(text);
  if (!match) return null;
  const day = match[format.dayGroup]?.padStart(2, '0');
  const monthName = (match[format.monthGroup] ?? '').toLowerCase();
  const year = match[format.yearGroup];
  const month = MONTHS.find((entry) => entry.name === monthName)?.index;
  if (!day || !month || !year) return null;
  const candidate = `${year}-${String(month).padStart(2, '0')}-${day}`;
  return isValidDateOnly(candidate) ? candidate : null;
}

/** Read a `DD Month YYYY` date. */
function parseDayMonth(text: string): string | null {
  return parseMonthDate(text, MONTH_DATE_FORMATS.dayMonth);
}

/** Read a `Month DD, YYYY` date. */
function parseMonthDay(text: string): string | null {
  return parseMonthDate(text, MONTH_DATE_FORMATS.monthDay);
}

/**
 * Read the first valid date in any of the supported formats.
 *
 * @param text the original input, before lower-casing
 * @returns an ISO `YYYY-MM-DD` date, or null
 */
export function parseEventDate(text: string): string | null {
  return parseIsoDate(text) ?? parseSlashDate(text) ?? parseDayMonth(text) ?? parseMonthDay(text);
}
