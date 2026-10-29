/**
 * Calendar-date helpers.
 *
 * Every calendar date in Gatherly is a date-only string (`YYYY-MM-DD`).
 * Arithmetic is done in UTC so a plan never drifts across a timezone
 * boundary, and formatted output is produced in the user's locale.
 */

export type DateOnly = string;

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Check that a string is a real calendar date in `YYYY-MM-DD` form.
 *
 * @param value the candidate ISO date string (YYYY-MM-DD)
 * @returns true when the string is a real date, false otherwise
 * @example
 * isValidDateOnly('2026-02-30'); // false
 */
export function isValidDateOnly(value: string): boolean {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/**
 * Parse a calendar date string into a UTC `Date` at midnight.
 *
 * @param value the ISO date string (YYYY-MM-DD)
 * @returns a UTC Date at 00:00 on that day
 * @throws RangeError when the string is not a real calendar date
 * @example
 * parseDateOnly('2026-10-29').toISOString(); // '2026-10-29T00:00:00.000Z'
 */
export function parseDateOnly(value: DateOnly): Date {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) throw new RangeError(`Not a calendar date: ${value}`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError(`Not a calendar date: ${value}`);
  }
  return date;
}

/**
 * Format a `Date` as a calendar date string, using its UTC fields.
 *
 * @param date the UTC Date to read
 * @returns the date as an ISO date string (YYYY-MM-DD)
 * @example
 * toDateOnly(new Date('2026-10-29T00:00:00Z')); // '2026-10-29'
 */
export function toDateOnly(date: Date): DateOnly {
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Add a whole number of days to a calendar date.
 *
 * @param value the starting ISO date string (YYYY-MM-DD)
 * @param days whole days to add; negative values move backwards
 * @returns the new ISO date string (YYYY-MM-DD)
 * @example
 * addDays('2026-10-29', 7); // '2026-11-05'
 */
export function addDays(value: DateOnly, days: number): DateOnly {
  const date = parseDateOnly(value);
  date.setUTCDate(date.getUTCDate() + days);
  return toDateOnly(date);
}

/** Whole days from `from` to `to` (negative when `to` is earlier). */
export function diffDays(from: DateOnly, to: DateOnly): number {
  const a = parseDateOnly(from).getTime();
  const b = parseDateOnly(to).getTime();
  return Math.round((b - a) / 86_400_000);
}

/**
 * Compare two calendar dates in chronological order.
 *
 * @param a the first ISO date string (YYYY-MM-DD)
 * @param b the second ISO date string (YYYY-MM-DD)
 * @returns -1 when `a` is earlier, 1 when later, 0 when equal
 * @example
 * compareDateOnly('2026-10-29', '2026-11-01'); // -1
 */
export function compareDateOnly(a: DateOnly, b: DateOnly): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Today's calendar date in the runtime's local timezone, from an injected clock.
 *
 * @param now the current time, supplied by the caller
 * @returns today's date as an ISO date string (YYYY-MM-DD)
 * @example
 * todayDateOnly(new Date(2026, 9, 29)); // '2026-10-29'
 */
export function todayDateOnly(now: Date): DateOnly {
  return toDateOnly(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

/** 1-12. */
export function monthOf(value: DateOnly): number {
  return parseDateOnly(value).getUTCMonth() + 1;
}

/**
 * Format a calendar date for the user's locale.
 *
 * @param value the ISO date string (YYYY-MM-DD)
 * @param locale BCP-47 locale tag used for month names and ordering
 * @param options Intl date options; defaults to day, short month and year
 * @returns the formatted date, or the input unchanged when it is not a real date
 * @example
 * formatDateOnly('2026-10-29', 'en-GB'); // '29 Oct 2026'
 */
export function formatDateOnly(
  value: DateOnly,
  locale = 'en',
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
): string {
  if (!isValidDateOnly(value)) return value;
  const date = parseDateOnly(value);
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(date);
}

/**
 * Format a start and end date as one readable range.
 * The year is shown once, at the end, which suits multi-day events.
 *
 * @param start the first ISO date string (YYYY-MM-DD)
 * @param end the last ISO date string (YYYY-MM-DD)
 * @param locale BCP-47 locale tag used for month names
 * @returns the formatted range, e.g. "29 Oct – 2 Nov 2026"
 * @example
 * formatDateTimeRange('2026-10-29', '2026-11-02', 'en-GB'); // '29 Oct – 2 Nov 2026'
 */
export function formatDateTimeRange(start: DateOnly, end: DateOnly, locale = 'en'): string {
  const startText = formatDateOnly(start, locale, { day: 'numeric', month: 'short' });
  const endText = formatDateOnly(end, locale, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startText} – ${endText}`;
}
