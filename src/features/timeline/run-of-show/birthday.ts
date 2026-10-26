import type { RunOfShowTemplate } from './template';

/** The birthday, hour by hour. */
export const BIRTHDAY_RUN_OF_SHOW: readonly RunOfShowTemplate[] = [
  {
    id: 'setup',
    start: '10:00',
    durationMinutes: 90,
    title: 'Setup, table, cake table',
    owner: 'Hosts',
    location: 'Venue',
    notes: 'Chairs, shade, drinks station.',
  },
  {
    id: 'guests-arrive',
    start: '12:00',
    durationMinutes: 45,
    title: 'Guests arrive, welcome drink',
    owner: 'Hosts',
    location: 'Garden',
    notes: 'Music at a level people can talk over.',
  },
  {
    id: 'photos',
    start: '12:45',
    durationMinutes: 40,
    title: 'Photographs',
    owner: 'Photographer',
    location: 'Garden',
    notes: 'Family first, then guests at their leisure.',
  },
  {
    id: 'food',
    start: '13:30',
    durationMinutes: 90,
    title: 'Food service',
    owner: 'Caterer',
    location: 'Dining area',
    notes: 'Cake after the main course, not before.',
  },
  {
    id: 'games',
    start: '15:00',
    durationMinutes: 60,
    title: 'Games and the cake',
    owner: 'Hosts',
    location: 'Lawn',
    notes: 'Keep it short and let people talk.',
  },
  {
    id: 'last-call',
    start: '16:30',
    durationMinutes: 30,
    title: 'Last call and thank yous',
    owner: 'Hosts',
    location: 'Dining area',
    notes: 'Thank each guest at the door.',
  },
];
