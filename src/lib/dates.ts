/**
 * Calendar-date helpers.
 *
 * Every calendar date in Gatherly is a date-only string (`YYYY-MM-DD`).
 * Arithmetic is done in UTC so a plan never drifts across a timezone
 * boundary, and formatted output is produced in the user's locale.
 */

export type DateOnly = string;

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

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

export function toDateOnly(date: Date): DateOnly {
  const year = String(date.getUTCFullYear()).padStart(4, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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

export function compareDateOnly(a: DateOnly, b: DateOnly): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function todayDateOnly(now: Date): DateOnly {
  return toDateOnly(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

/** 1-12. */
export function monthOf(value: DateOnly): number {
  return parseDateOnly(value).getUTCMonth() + 1;
}

export function formatDateOnly(
  value: DateOnly,
  locale = 'en',
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' },
): string {
  if (!isValidDateOnly(value)) return value;
  const date = parseDateOnly(value);
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(date);
}

export function formatDateTimeRange(start: DateOnly, end: DateOnly, locale = 'en'): string {
  const startText = formatDateOnly(start, locale, { day: 'numeric', month: 'short' });
  const endText = formatDateOnly(end, locale, { day: 'numeric', month: 'short', year: 'numeric' });
  return `${startText} – ${endText}`;
}
