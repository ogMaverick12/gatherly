/**
 * Community idea templates.
 *
 * Every entry matches community gatherings only; shared advice lives in the generic file.
 */

import type { IdeaTemplate } from './template';

/** Ideas that only make sense for a community gathering. */
export const COMMUNITY_IDEAS: readonly IdeaTemplate[] = [
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
