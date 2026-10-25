import {
  DIETARY_LABELS,
  type CityTier,
  type DietaryNeed,
  type EventType,
  type Idea,
  type Priority,
} from '@/lib/plan';
import type { ProviderIdea } from '@/lib/api-schema';
import { formatMinor } from '@/lib/money';

/**
 * Ideas engine - the deterministic "Basic mode".
 *
 * These are planning suggestions derived from the numbers already in the
 * plan. They are not model output and the app never labels them as such.
 * Every idea quotes the user's own figures so it reads as advice about
 * *their* event rather than generic filler.
 */

export interface IdeaContext {
  readonly guests: number;
  readonly eventType: EventType;
  readonly cityTier: CityTier;
  readonly priorities: readonly Priority[];
  readonly dietary: readonly DietaryNeed[];
  readonly month: number | null;
  readonly currency: PlanCurrency;
  readonly budgetMinor: number;
  readonly perGuestMinor: number;
}

export type PlanCurrency = Parameters<typeof formatMinor>[1];

type CostImpact = 'none' | 'low' | 'medium' | 'high';

interface IdeaTemplate {
  readonly id: string;
  readonly eventTypes: readonly EventType[] | 'all';
  readonly title: string;
  readonly body: string;
  readonly rationale: (context: IdeaContext) => string;
  readonly costImpact: CostImpact;
  readonly tags: readonly string[];
  /** 0 excludes the idea, higher numbers are more relevant. */
  readonly relevance: (context: IdeaContext) => number;
}

const TEMPLATES: readonly IdeaTemplate[] = [
  {
    id: 'contingency-discipline',
    eventTypes: 'all',
    title: 'Decide now what the contingency is for',
    body: 'Ring-fence the reserve and write down the three things it is allowed to cover: a last-minute guest, a broken rental, or a re-print.',
    rationale: (context) =>
      `You set aside 8% of ${formatMinor(context.budgetMinor, context.currency)} - that is money that only helps if it is protected.`,
    costImpact: 'none',
    tags: ['budget', 'calm'],
    relevance: () => 3,
  },
  {
    id: 'one-page-contact-sheet',
    eventTypes: 'all',
    title: 'One page with every number on it',
    body: 'Venue, caterer, photographer, the one contact for the day, the key times and the address - on a single sheet, printed twice.',
    rationale: (context) =>
      `With ${context.guests} guests and more suppliers than you can hold in your head, one sheet removes the most common source of day-of stress.`,
    costImpact: 'low',
    tags: ['logistics'],
    relevance: () => 4,
  },
  {
    id: 'named-day-of-person',
    eventTypes: 'all',
    title: 'Name one person for the day',
    body: 'One person - not two - holds the run of show, the vendor list and the money, and answers the small questions so you do not have to.',
    rationale: () =>
      'The people who carry an event are usually the people having the most fun at it.',
    costImpact: 'none',
    tags: ['people', 'calm'],
    relevance: () => 4,
  },
  {
    id: 'access-in-writing',
    eventTypes: 'all',
    title: 'Ask the venue three access questions in writing',
    body: 'Is there a step-free route from the car park, is there a quiet room, and is there a working hearing loop? Three sentences, one email, keep the reply.',
    rationale: (context) =>
      context.dietary.length >= 0
        ? 'Access questions are the ones most often answered politely on the phone and forgotten on the day.'
        : '',
    costImpact: 'none',
    tags: ['accessibility'],
    relevance: (context) => (context.eventType === 'community' ? 6 : 4),
  },
  {
    id: 'table-dietary-cards',
    eventTypes: 'all',
    title: 'Put a small card on each table',
    body: 'A card listing the dishes that suit the dietary needs you recorded, and where to find the labelled plates.',
    rationale: (context) =>
      context.dietary.length > 0
        ? `You recorded ${context.dietary.map((need) => DIETARY_LABELS[need].toLowerCase()).join(', ')} - a card means nobody has to explain it out loud at the table.`
        : 'Even with no dietary needs recorded, a card saves the awkward question at the table.',
    costImpact: 'low',
    tags: ['catering', 'guest-experience'],
    relevance: (context) => (context.dietary.length > 0 ? 6 : 2),
  },
  {
    id: 'no-list',
    eventTypes: 'all',
    title: 'Write a short "we are not doing this" list',
    body: 'Three things you are not doing, and why. It is the fastest way to stop the plan growing after you have decided it.',
    rationale: () =>
      'Most event regret comes from doing one more thing, not from doing fewer things well.',
    costImpact: 'none',
    tags: ['calm', 'planning'],
    relevance: (context) => (context.priorities.includes('simplicity') ? 6 : 3),
  },
  {
    id: 'sustainability-swap',
    eventTypes: 'all',
    title: 'Borrow the celebration, do not buy all of it',
    body: 'Ask two guests to lend the things you would otherwise hire, and agree the return date before you collect them.',
    rationale: () =>
      'Borrowing usually costs nothing and usually saves more than a discount would.',
    costImpact: 'low',
    tags: ['sustainability', 'budget'],
    relevance: (context) => (context.priorities.includes('sustainability') ? 6 : 2),
  },

  /* Wedding */
  {
    id: 'wedding-family-photos-first',
    eventTypes: ['wedding'],
    title: 'Photograph the families first',
    body: 'Ask for the two family groups before the guests are called in, then let the rest of the photographs happen at their own pace.',
    rationale: (context) =>
      `Two group photographs take about fifteen minutes with ${context.guests} guests. Doing them first means nobody is standing in the sun waiting for a cousin.`,
    costImpact: 'none',
    tags: ['photography', 'flow'],
    relevance: (context) => (context.priorities.includes('photography') ? 6 : 4),
  },
  {
    id: 'wedding-quiet-room',
    eventTypes: ['wedding'],
    title: 'A quiet room that is not the changing room',
    body: 'A small room with chairs, water and low light for anyone who needs to step out - and a note on the invitation that it exists.',
    rationale: (context) =>
      `A long wedding holds a lot of people who need a pause. A day of ${context.guests} guests will include a few of them.`,
    costImpact: 'low',
    tags: ['guest-experience', 'accessibility'],
    relevance: () => 5,
  },
  {
    id: 'wedding-buffer',
    eventTypes: ['wedding'],
    title: 'Leave sixty minutes between the ceremony and the photographs',
    body: 'Guests use it to sit down, to find their children, to use the toilets. The photographs then happen in good light rather than in a hurry.',
    rationale: () => 'The hour you think you will save is the hour the whole day runs late by.',
    costImpact: 'none',
    tags: ['flow', 'timeline'],
    relevance: () => 5,
  },
  {
    id: 'wedding-last-transport',
    eventTypes: ['wedding'],
    title: 'Book transport for the last twenty guests',
    body: 'Keep a taxi or shuttle on standby for the end of the evening, and tell the family it exists.',
    rationale: () =>
      'The people who leave last are often the ones who did not plan how they would get home.',
    costImpact: 'medium',
    tags: ['logistics'],
    relevance: () => 4,
  },
  {
    id: 'wedding-payment-person',
    eventTypes: ['wedding'],
    title: 'One person pays, one person records',
    body: 'All payments go through one person, and every payment is written down with the date and the amount.',
    rationale: () =>
      'Payments and receipts get separated when several people are paying, and it is the least glamorous way to lose money.',
    costImpact: 'none',
    tags: ['budget', 'logistics'],
    relevance: () => 4,
  },

  /* Birthday */
  {
    id: 'birthday-cake-time',
    eventTypes: ['birthday'],
    title: 'Give the cake a time, not a vibe',
    body: 'Decide when the cake is cut - usually after the main food - and put it in the run of show so nobody cuts it during the photographs.',
    rationale: () =>
      'Cake timing is the single most common reason a party photograph shows a half-eaten cake.',
    costImpact: 'none',
    tags: ['food', 'flow'],
    relevance: () => 5,
  },
  {
    id: 'birthday-wet-weather-hold',
    eventTypes: ['birthday'],
    title: 'Ask the venue to hold the indoor room for a day',
    body: 'Get the wet-weather room held at the same price for at least 24 hours, so a forecast does not cost you the venue.',
    rationale: () =>
      'A day of notice is usually enough to move a party indoors without losing the space.',
    costImpact: 'none',
    tags: ['logistics', 'weather'],
    relevance: (context) =>
      context.month !== null && [6, 7, 8, 9].includes(context.month) ? 6 : 3,
  },
  {
    id: 'birthday-first-30',
    eventTypes: ['birthday'],
    title: 'Keep the first thirty minutes unstructured',
    body: 'Let people arrive, find a drink and find each other before anything is announced.',
    rationale: (context) =>
      `${context.guests} people arriving at once is already a lot to manage. A schedule that starts with a speech makes it worse.`,
    costImpact: 'none',
    tags: ['flow', 'guest-experience'],
    relevance: () => 5,
  },
  {
    id: 'birthday-photo-spot',
    eventTypes: ['birthday'],
    title: 'Choose one photo spot and tell people about it',
    body: 'One good spot, mentioned on the invitation, beats three average ones nobody finds.',
    rationale: (context) =>
      `With ${context.guests} guests, a shared photo spot gives you pictures with everyone in them.`,
    costImpact: 'none',
    tags: ['photography'],
    relevance: (context) => (context.priorities.includes('photography') ? 6 : 3),
  },
  {
    id: 'birthday-gift-bag',
    eventTypes: ['birthday'],
    title: 'A single bag for cards and gifts',
    body: 'One box by the door, and one person responsible for it. Cards get written at the table, not lost in a coat.',
    rationale: () =>
      'Gifts and cards scattered across three rooms is a problem you will solve on the evening of the party.',
    costImpact: 'low',
    tags: ['gifts', 'logistics'],
    relevance: () => 4,
  },

  /* Community */
  {
    id: 'community-dish-signin',
    eventTypes: ['community'],
    title: 'A sign-in sheet for the dishes',
    body: 'One sheet listing what each household is bringing, who brought it and any allergens.',
    rationale: (context) =>
      `With ${context.guests} people and many dishes, a list is the difference between a shared meal and a guessing game.`,
    costImpact: 'none',
    tags: ['catering', 'community'],
    relevance: () => 6,
  },
  {
    id: 'community-two-lines',
    eventTypes: ['community'],
    title: 'Two serving lines, not one',
    body: 'Split the serving so the queue halves, and put the plates at the end of the line so nobody carries a full plate.',
    rationale: (context) =>
      `A single line for ${context.guests} guests turns a ten-minute wait into a twenty-minute wait.`,
    costImpact: 'none',
    tags: ['catering', 'flow'],
    relevance: () => 5,
  },
  {
    id: 'community-volunteer-rota',
    eventTypes: ['community'],
    title: 'A volunteer rota with names, not roles',
    body: 'Six names, six jobs, two hours each, written on the wall by the door.',
    rationale: () =>
      'Roles are ambiguous. Names are not - a named person is there, and a named person can be asked again.',
    costImpact: 'none',
    tags: ['people', 'logistics'],
    relevance: () => 5,
  },
  {
    id: 'community-quiet-table',
    eventTypes: ['community'],
    title: 'Keep one table away from the speakers',
    body: 'A table near the exit, with lower sound, for anyone who finds a crowded room tiring.',
    rationale: (context) =>
      `In a room of ${context.guests}, the quiet table is the most generous thing you can put in the plan.`,
    costImpact: 'none',
    tags: ['accessibility', 'guest-experience'],
    relevance: (context) => (context.priorities.includes('accessibility') ? 6 : 4),
  },
  {
    id: 'community-contributions',
    eventTypes: ['community'],
    title: 'Collect contributions in one place',
    body: 'One collection point, one receipt for every contribution, and a note of who gave what.',
    rationale: () => 'Shared money needs a single book. It also protects the people who gave.',
    costImpact: 'none',
    tags: ['budget', 'people'],
    relevance: () => 5,
  },
  {
    id: 'community-photo-board',
    eventTypes: ['community'],
    title: 'A noticeboard for the photographs',
    body: 'Pin up a few pictures from previous years, and one blank sheet for the people who have never attended.',
    rationale: () =>
      'It turns a room of strangers into a room with a shared history, and it costs a board and some pins.',
    costImpact: 'low',
    tags: ['community', 'decor'],
    relevance: () => 4,
  },
];

function tierNote(tier: CityTier): string {
  if (tier === 'tier1') return 'a high-cost city, where permits and peak-season dates go early';
  if (tier === 'tier2') return 'a regional city, where the venue calendar fills a few months out';
  return 'a smaller town, where the local suppliers know each other and the dates move slower';
}

/**
 * Turn validated model ideas into the shape the app stores and shows.
 *
 * @param ideas the schemas' ideas, already checked by the route
 * @returns the same ideas with an id and the provider source
 */
export function providerIdeas(ideas: readonly ProviderIdea[]): Idea[] {
  return ideas.map((idea, index) => ({
    id: `provider-idea-${index + 1}`,
    title: idea.title,
    body: idea.body,
    rationale: idea.rationale,
    costImpactMinor: null,
    tags: idea.tags,
    source: 'provider',
  }));
}

export function generateIdeas(context: IdeaContext): Idea[] {
  const applicable = TEMPLATES.filter(
    (template) => template.eventTypes === 'all' || template.eventTypes.includes(context.eventType),
  );
  const scored = applicable
    .map((template) => ({
      template,
      score: template.relevance(context),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.template.id.localeCompare(b.template.id));

  return scored.slice(0, 12).map(({ template }) => ({
    id: template.id,
    title: template.title,
    body: template.body,
    rationale: template.rationale(context),
    costImpactMinor: null,
    tags: [...template.tags],
    source: 'basic' as const,
  }));
}

/** A short, plan-specific summary used by the assistant and the overview. */
export function describePlanShape(context: IdeaContext): string {
  return `${context.guests} guests, ${formatMinor(context.perGuestMinor, context.currency)} per guest, in ${tierNote(context.cityTier)}.`;
}
