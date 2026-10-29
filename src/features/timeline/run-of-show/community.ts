/**
 * The community gathering run of show.
 *
 * Times are clock labels rather than dates; the timeline service returns them
 * in order and leaves duration arithmetic to the caller.
 */

import type { RunOfShowTemplate } from './template';

/** The community gathering, hour by hour. */
export const COMMUNITY_RUN_OF_SHOW: readonly RunOfShowTemplate[] = [
  {
    id: 'setup',
    start: '08:00',
    durationMinutes: 150,
    title: 'Setup: tables, kitchen, signage',
    owner: 'Volunteers',
    location: 'Hall',
    notes: 'Check the step-free route and the hearing loop.',
  },
  {
    id: 'food-arrives',
    start: '10:30',
    durationMinutes: 90,
    title: 'Dishes arrive from contributors',
    owner: 'Kitchen team',
    location: 'Kitchen',
    notes: 'Label every dish with its contributor.',
  },
  {
    id: 'doors',
    start: '12:00',
    durationMinutes: 60,
    title: 'Doors open, welcome and seating',
    owner: 'Hosts',
    location: 'Hall',
    notes: 'Volunteers at the door with the seating plan.',
  },
  {
    id: 'shared-meal',
    start: '13:00',
    durationMinutes: 120,
    title: 'Shared meal service',
    owner: 'Kitchen team',
    location: 'Hall',
    notes: 'Serve the shared dishes first.',
  },
  {
    id: 'music',
    start: '15:00',
    durationMinutes: 90,
    title: 'Music, stories and the long table',
    owner: 'Hosts',
    location: 'Hall',
    notes: 'A quiet moment for elders in the middle.',
  },
  {
    id: 'close',
    start: '16:30',
    durationMinutes: 45,
    title: 'Close, thanks and clean-up rota',
    owner: 'Volunteers',
    location: 'Hall',
    notes: 'Leave the hall the way you found it.',
  },
];
