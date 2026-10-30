/**
 * Shared idea templates.
 *
 * These apply to every event type and carry the advice that is not specific to
 * a wedding, a birthday or a community gathering.
 */

import { DIETARY_LABELS } from '@/lib/plan';
import { formatMoney } from '@/lib/money';
import type { IdeaTemplate } from './template';

/** Ideas that suit any event type. */
export const GENERIC_IDEAS: readonly IdeaTemplate[] = [
  {
    id: 'contingency-discipline',
    eventTypes: 'all',
    title: 'Decide now what the contingency is for',
    body: 'Ring-fence the reserve and write down the three things it is allowed to cover: a last-minute guest, a broken rental, or a re-print.',
    rationale: (context) =>
      `You set aside 8% of ${formatMoney(context.budgetMinor, context.currency)} - that is money that only helps if it is protected.`,
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
];
