import type { IdeaTemplate } from './template';

/** Ideas that only make sense for a wedding. */
export const WEDDING_IDEAS: readonly IdeaTemplate[] = [
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
];
