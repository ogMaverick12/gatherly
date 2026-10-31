/**
 * The free-text intake parser.
 *
 * It matches only the published keyword tables and returns null for anything
 * it did not read, so an unrecognised phrase never becomes a plan value.
 */

import type { ParsedFields } from '@/lib/api-schema';
import {
  ACCESS_NEEDS,
  DIETARY_NEEDS,
  PRIORITIES,
  type CityTier,
  type DietaryNeed,
  type EventType,
  type Priority,
} from '@/lib/plan';
import {
  ACCESS_WORDS,
  DIETARY_WORDS,
  EVENT_TYPE_KEYWORDS,
  PRIORITY_WORDS,
  TIER_KEYWORDS,
} from './parse-keywords';
import { parseBudget } from './parse-budget';
import { parseEventDate } from './parse-dates';
import { matchAll, matchFirst } from './parse-match';

/** The largest guest count the parser will accept. */
const MAX_GUESTS = 5_000;

/** The most priorities copied from one sentence. */
const MAX_PRIORITIES = 4;

/** The most dietary needs copied from one sentence. */
const MAX_DIETARY_NEEDS = 12;

/** The most access needs copied from one sentence. */
const MAX_ACCESS_NEEDS = 12;

/** The longest free-text note kept in the plan. */
const MAX_NOTES_LENGTH = 1_000;

/** Read a guest count from a phrase such as "80 guests" or "about 60 people". */
function parseGuests(text: string): number | null {
  const match =
    /(\d[\d,]{0,9})\s*(?:guests?|people|persons?|attendees|pax)/i.exec(text) ??
    /(?:about|around|roughly|approximately|~)?\s*(\d[\d,]{0,9})\s*(?:of us|people coming)/i.exec(
      text,
    );
  if (!match?.[1]) return null;
  const value = Number(match[1].replace(/,/g, ''));
  if (!Number.isFinite(value) || value < 1 || value > MAX_GUESTS) return null;
  return Math.round(value);
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
    priorities: priorities.slice(0, MAX_PRIORITIES),
    dietary: dietary.slice(0, MAX_DIETARY_NEEDS),
    access: access.slice(0, MAX_ACCESS_NEEDS),
    notes: input.trim().slice(0, MAX_NOTES_LENGTH),
  };
}
