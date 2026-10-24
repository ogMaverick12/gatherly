import type { Plan } from '@/lib/plan';
import { formatDateOnly } from '@/lib/dates';

/**
 * Calendar export (iCalendar).
 *
 * Produces one event for the celebration and one all-day event for each
 * milestone, so the plan can live in the same calendar as the day itself.
 * Output follows RFC 5545: escaped text, folded lines and date-only values.
 */

function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** UTF-8 octets used by one code point. */
function octetLength(codePoint: number): number {
  if (codePoint <= 0x7f) return 1;
  if (codePoint <= 0x7ff) return 2;
  if (codePoint <= 0xffff) return 3;
  return 4;
}

/** Length of a string in UTF-8 octets. */
function utf8Length(value: string): number {
  let total = 0;
  for (const character of value) total += octetLength(character.codePointAt(0) ?? 0);
  return total;
}

/**
 * Fold a line to the 75-octet limit RFC 5545 sets.
 *
 * The limit counts octets, not characters, so a line written in Devanagari or
 * Bengali has to be folded much earlier than the same text in English.
 * Continuation lines start with one space, and that space is part of the
 * limit. A code point is never split across two lines.
 */
function foldLine(line: string): string {
  const limit = 75;
  if (utf8Length(line) <= limit) return line;

  const parts: string[] = [];
  let current = '';
  let currentBytes = 0;

  for (const character of line) {
    const bytes = octetLength(character.codePointAt(0) ?? 0);
    const budget = parts.length === 0 ? limit : limit - 1;
    if (current !== '' && currentBytes + bytes > budget) {
      parts.push(current);
      current = '';
      currentBytes = 0;
    }
    current += character;
    currentBytes += bytes;
  }
  if (current !== '') parts.push(current);

  return parts.map((part, index) => (index === 0 ? part : ` ${part}`)).join('\r\n');
}

function toIcsDate(dateOnly: string): string {
  return dateOnly.replace(/-/g, '');
}

function toStamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

export interface CalendarOptions {
  readonly now?: Date;
  readonly locale?: string;
}

export function buildCalendar(plan: Plan, options: CalendarOptions = {}): string {
  const now = options.now ?? new Date();
  const stamp = toStamp(now);
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Gatherly//Event plan//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const eventDate = plan.intake.eventDate;

  if (eventDate) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${plan.id}-event@gatherly`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(eventDate)}`,
      `DTEND;VALUE=DATE:${toIcsDate(eventDate)}`,
      `SUMMARY:${escapeText('Gatherly plan')}`,
      `DESCRIPTION:${escapeText(
        `${plan.intake.guests} guests. ${formatDateOnly(eventDate, options.locale ?? 'en')}.`,
      )}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }

  for (const milestone of plan.milestones) {
    if (!milestone.date) continue;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${plan.id}-${milestone.id}@gatherly`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(milestone.date)}`,
      `DTEND;VALUE=DATE:${toIcsDate(milestone.date)}`,
      `SUMMARY:${escapeText(milestone.title)}`,
      `DESCRIPTION:${escapeText(milestone.whyItMatters)}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n');
}
