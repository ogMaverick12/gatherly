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
import { fromMajorUnits } from '@/lib/money';
import { isValidDateOnly } from '@/lib/dates';
import type { ParsedFields } from '@/lib/api-schema';

/**
 * Deterministic free-text parsing.
 *
 * This is the Basic-mode path for turning notes into plan fields. It only
 * extracts what the text actually states. If a value is not there, it stays
 * empty - a plan built on a guess is worse than a plan with a blank.
 */

const EVENT_TYPE_KEYWORDS: readonly { value: EventType; words: readonly string[] }[] = [
  { value: 'wedding', words: ['wedding', 'marriage', 'shaadi', 'baraat', 'sangeet', 'mehendi'] },
  { value: 'birthday', words: ['birthday', 'birth day', 'bday', 'anniversary', 'cake'] },
  {
    value: 'community',
    words: ['community', 'gathering', 'potluck', 'sangam', 'fellowship', 'meeting'],
  },
];

const TIER_KEYWORDS: readonly { value: CityTier; words: readonly string[] }[] = [
  {
    value: 'tier1',
    words: [
      'tier 1',
      'tier-1',
      'tier one',
      'metro',
      'mumbai',
      'delhi',
      'bangalore',
      'london',
      'new york',
      'dubai',
      'singapore',
    ],
  },
  {
    value: 'tier2',
    words: [
      'tier 2',
      'tier-2',
      'tier two',
      'regional city',
      'jaipur',
      'lucknow',
      'pune',
      'manchester',
    ],
  },
  { value: 'tier3', words: ['tier 3', 'tier-3', 'tier three', 'small town', 'village'] },
];

const CURRENCY_KEYWORDS: readonly { value: Currency; words: readonly string[] }[] = [
  { value: 'INR', words: ['₹', 'inr', 'rupee', 'rupees'] },
  { value: 'USD', words: ['$', 'usd', 'dollar', 'dollars'] },
  { value: 'EUR', words: ['€', 'eur', 'euro', 'euros'] },
  { value: 'GBP', words: ['£', 'gbp', 'pound', 'pounds', 'sterling'] },
  { value: 'AED', words: ['aed', 'dirham', 'dirhams'] },
  { value: 'NGN', words: ['₦', 'ngn', 'naira', 'nairas'] },
  { value: 'IDR', words: ['idr', 'rupiah'] },
  { value: 'BRL', words: ['brl', 'real', 'reais'] },
  { value: 'ZAR', words: ['zar', 'rand'] },
  { value: 'AUD', words: ['aud', 'a$'] },
  { value: 'CAD', words: ['cad', 'c$'] },
  { value: 'SGD', words: ['sgd', 's$', 'singapore dollar'] },
  { value: 'KES', words: ['kes', 'shilling', 'shillings'] },
  { value: 'PHP', words: ['php', '₱', 'peso'] },
  { value: 'MXN', words: ['mxn', 'mexican peso'] },
  { value: 'NPR', words: ['npr', 'nepalese rupee'] },
  { value: 'BDT', words: ['bdt', 'taka'] },
  { value: 'PKR', words: ['pkr', 'pakistani rupee'] },
  { value: 'LKR', words: ['lkr', 'sri lankan rupee'] },
  { value: 'JPY', words: ['jpy', '¥', 'yen'] },
];

const PRIORITY_WORDS: readonly { value: Priority; words: readonly string[] }[] = [
  {
    value: 'photography',
    words: ['photo', 'photos', 'photography', 'photographer', 'camera', 'film', 'video'],
  },
  {
    value: 'food',
    words: ['food', 'catering', 'caterer', 'menu', 'cuisine', 'cake', 'dinner', 'lunch'],
  },
  { value: 'music', words: ['music', 'dj', 'band', 'sound', 'playlist'] },
  { value: 'decor', words: ['decor', 'decoration', 'flowers', 'floral', 'lighting'] },
  { value: 'logistics', words: ['logistics', 'transport', 'travel', 'parking', 'shuttle'] },
  {
    value: 'guest-experience',
    words: ['guest', 'guests', 'comfort', 'hospitality', 'ambience', 'ambiance'],
  },
  {
    value: 'accessibility',
    words: ['accessibility', 'accessible', 'wheelchair', 'hearing loop', 'sign language'],
  },
  {
    value: 'sustainability',
    words: ['sustainable', 'sustainability', 'eco', 'environment', 'waste', 'recycl'],
  },
  { value: 'formality', words: ['formal', 'formality', 'traditional', 'tradition', 'custom'] },
  { value: 'simplicity', words: ['simple', 'simplicity', 'easy', 'relaxed', 'informal'] },
];

const DIETARY_WORDS: readonly { value: DietaryNeed; words: readonly string[] }[] = [
  { value: 'vegan', words: ['vegan'] },
  { value: 'vegetarian', words: ['vegetarian', 'veg '] },
  { value: 'halal', words: ['halal'] },
  { value: 'kosher', words: ['kosher'] },
  { value: 'gluten-free', words: ['gluten free', 'gluten-free', 'coeliac', 'celiac'] },
  { value: 'nut-free', words: ['nut free', 'nut-free', 'peanut allergy', 'nut allergy'] },
  { value: 'dairy-free', words: ['dairy free', 'dairy-free', 'lactose'] },
  { value: 'egg-free', words: ['egg free', 'egg-free'] },
  { value: 'low-sodium', words: ['low sodium', 'low-sodium', 'no salt'] },
  { value: 'diabetic', words: ['diabetic', 'diabetes', 'low sugar', 'low-sugar'] },
];

const ACCESS_WORDS: readonly { value: string; words: readonly string[] }[] = [
  { value: 'wheelchair', words: ['wheelchair', 'wheel chair'] },
  { value: 'step-free', words: ['step free', 'step-free', 'no steps', 'wheelchair access'] },
  { value: 'hearing-loop', words: ['hearing loop', 'hearing aid'] },
  { value: 'captioning', words: ['captioning', 'captions', 'sign language', 'signing'] },
  { value: 'quiet-room', words: ['quiet room', 'quiet space', 'quiet area'] },
  { value: 'reserved-seating', words: ['reserved seating', 'seating for elders', 'front seat'] },
  { value: 'rest-area', words: ['rest area', 'rest room', 'lounge for elders'] },
  { value: 'service-animal', words: ['service animal', 'guide dog', 'assistance dog'] },
];

const MONTHS: readonly { name: string; index: number }[] = [
  { name: 'january', index: 1 },
  { name: 'february', index: 2 },
  { name: 'march', index: 3 },
  { name: 'april', index: 4 },
  { name: 'may', index: 5 },
  { name: 'june', index: 6 },
  { name: 'july', index: 7 },
  { name: 'august', index: 8 },
  { name: 'september', index: 9 },
  { name: 'october', index: 10 },
  { name: 'november', index: 11 },
  { name: 'december', index: 12 },
  { name: 'jan', index: 1 },
  { name: 'feb', index: 2 },
  { name: 'mar', index: 3 },
  { name: 'apr', index: 4 },
  { name: 'jun', index: 6 },
  { name: 'jul', index: 7 },
  { name: 'aug', index: 8 },
  { name: 'sep', index: 9 },
  { name: 'sept', index: 9 },
  { name: 'oct', index: 10 },
  { name: 'nov', index: 11 },
  { name: 'dec', index: 12 },
];

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

function parseEventDate(text: string): string | null {
  const iso = /(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (iso) {
    const candidate = `${iso[1]}-${iso[2]}-${iso[3]}`;
    if (isValidDateOnly(candidate)) return candidate;
  }

  const slash = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(text);
  if (slash) {
    const day = slash[1]?.padStart(2, '0');
    const month = slash[2]?.padStart(2, '0');
    const year = slash[3];
    if (day && month && year) {
      const candidate = `${year}-${month}-${day}`;
      if (isValidDateOnly(candidate)) return candidate;
    }
  }

  const dayMonth = /(\d{1,2})\s+([a-z]+)\s+(\d{4})/i.exec(text);
  if (dayMonth) {
    const day = dayMonth[1]?.padStart(2, '0');
    const monthName = (dayMonth[2] ?? '').toLowerCase();
    const year = dayMonth[3];
    const month = MONTHS.find((entry) => entry.name === monthName)?.index;
    if (day && month && year) {
      const candidate = `${year}-${String(month).padStart(2, '0')}-${day}`;
      if (isValidDateOnly(candidate)) return candidate;
    }
  }

  const monthDay = /([a-z]+)\s+(\d{1,2}),?\s+(\d{4})/i.exec(text);
  if (monthDay) {
    const monthName = (monthDay[1] ?? '').toLowerCase();
    const day = monthDay[2]?.padStart(2, '0');
    const year = monthDay[3];
    const month = MONTHS.find((entry) => entry.name === monthName)?.index;
    if (day && month && year) {
      const candidate = `${year}-${String(month).padStart(2, '0')}-${day}`;
      if (isValidDateOnly(candidate)) return candidate;
    }
  }

  return null;
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
