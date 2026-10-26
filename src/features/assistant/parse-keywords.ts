import type { CityTier, Currency, DietaryNeed, EventType, Priority } from '@/lib/plan';

/**
 * The words the free-text parser looks for, one table per field.
 *
 * A table is the whole of the vocabulary: the parser matches against these and
 * infers nothing beyond them, so a phrase the user did not say cannot become a
 * value in their plan.
 */

export const EVENT_TYPE_KEYWORDS: readonly { value: EventType; words: readonly string[] }[] = [
  { value: 'wedding', words: ['wedding', 'marriage', 'shaadi', 'baraat', 'sangeet', 'mehendi'] },
  { value: 'birthday', words: ['birthday', 'birth day', 'bday', 'anniversary', 'cake'] },
  {
    value: 'community',
    words: ['community', 'gathering', 'potluck', 'sangam', 'fellowship', 'meeting'],
  },
];

export const TIER_KEYWORDS: readonly { value: CityTier; words: readonly string[] }[] = [
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

export const CURRENCY_KEYWORDS: readonly { value: Currency; words: readonly string[] }[] = [
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

export const PRIORITY_WORDS: readonly { value: Priority; words: readonly string[] }[] = [
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

export const DIETARY_WORDS: readonly { value: DietaryNeed; words: readonly string[] }[] = [
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

export const ACCESS_WORDS: readonly { value: string; words: readonly string[] }[] = [
  { value: 'wheelchair', words: ['wheelchair', 'wheel chair'] },
  { value: 'step-free', words: ['step free', 'step-free', 'no steps', 'wheelchair access'] },
  { value: 'hearing-loop', words: ['hearing loop', 'hearing aid'] },
  { value: 'captioning', words: ['captioning', 'captions', 'sign language', 'signing'] },
  { value: 'quiet-room', words: ['quiet room', 'quiet space', 'quiet area'] },
  { value: 'reserved-seating', words: ['reserved seating', 'seating for elders', 'front seat'] },
  { value: 'rest-area', words: ['rest area', 'rest room', 'lounge for elders'] },
  { value: 'service-animal', words: ['service animal', 'guide dog', 'assistance dog'] },
];

export const MONTHS: readonly { name: string; index: number }[] = [
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
