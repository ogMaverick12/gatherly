/** What the user is asking for, read from their words alone. */
export type AssistantIntent =
  'budget' | 'timeline' | 'vendors' | 'catering' | 'next-step' | 'general';

const INTENT_KEYWORDS: Record<AssistantIntent, readonly string[]> = {
  // The order matters: on a tie the first intent wins, and the specific
  // subjects are checked before the broad one, so "how much is the food"
  // is about catering rather than about the budget in general.
  catering: [
    'food',
    'catering',
    'meal',
    'menu',
    'plate',
    'drink',
    'diet',
    'vegetarian',
    'vegan',
    'halal',
    'cake',
  ],
  vendors: [
    'vendor',
    'caterer',
    'photographer',
    'venue',
    'decorator',
    'dj',
    'book',
    'quote',
    'supplier',
  ],
  timeline: [
    'timeline',
    'schedule',
    'date',
    'when',
    'milestone',
    'order',
    'week before',
    'day before',
  ],
  'next-step': [
    'next',
    'what should i do',
    'what now',
    'priority',
    'first',
    'worry',
    'worried',
    'stuck',
  ],
  budget: [
    'budget',
    'money',
    'cost',
    'spend',
    'spending',
    'price',
    'expensive',
    'afford',
    'allocate',
  ],
  general: [],
};

export function classifyIntent(text: string): AssistantIntent {
  const normalised = text.toLowerCase();
  let best: AssistantIntent = 'general';
  let bestScore = 0;

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [
    AssistantIntent,
    readonly string[],
  ][]) {
    if (intent === 'general') continue;
    let score = 0;
    for (const keyword of keywords) {
      if (normalised.includes(keyword)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = intent;
    }
  }

  return bestScore > 0 ? best : 'general';
}
