import type { IdeaTemplate } from './template';

/** Ideas that only make sense for a birthday. */
export const BIRTHDAY_IDEAS: readonly IdeaTemplate[] = [
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
];
