/**
 * The wedding run of show.
 *
 * Times are clock labels rather than dates; the timeline service returns them
 * in order and leaves duration arithmetic to the caller.
 */

import type { RunOfShowTemplate } from './template';

/** The wedding day, hour by hour. */
export const WEDDING_RUN_OF_SHOW: readonly RunOfShowTemplate[] = [
  {
    id: 'setup',
    start: '07:00',
    durationMinutes: 120,
    title: 'Setup, flowers, sound check',
    owner: 'Decor and venue',
    location: 'Venue',
    notes: 'Test the microphone and the music inputs.',
  },
  {
    id: 'vendors-arrive',
    start: '09:00',
    durationMinutes: 60,
    title: 'Vendors arrive, kit check',
    owner: 'You',
    location: 'Back room',
    notes: 'Rings, keys, envelopes, first aid.',
  },
  {
    id: 'guests-arrive',
    start: '10:00',
    durationMinutes: 90,
    title: 'Guests arrive, welcome drink',
    owner: 'Hosts',
    location: 'Welcome area',
    notes: 'Seating plan at the entrance.',
  },
  {
    id: 'ceremony',
    start: '11:30',
    durationMinutes: 75,
    title: 'Ceremony',
    owner: 'Officiant',
    location: 'Ceremony space',
    notes: 'Keep this to the plan; do not extend it.',
  },
  {
    id: 'photos',
    start: '12:45',
    durationMinutes: 60,
    title: 'Family photographs',
    owner: 'Photographer',
    location: 'Garden or foyer',
    notes: 'Group list ready, printed.',
  },
  {
    id: 'lunch',
    start: '14:00',
    durationMinutes: 120,
    title: 'Lunch service',
    owner: 'Caterer',
    location: 'Dining area',
    notes: 'Serve dietary meals first, unmarked plates to the table.',
  },
  {
    id: 'quiet-hour',
    start: '16:00',
    durationMinutes: 60,
    title: 'Quiet hour for elders and rest',
    owner: 'Hosts',
    location: 'Side room',
    notes: 'Water, seating, low light, no music.',
  },
  {
    id: 'reception-start',
    start: '17:00',
    durationMinutes: 60,
    title: 'Reception opens, drinks and canapes',
    owner: 'Hosts',
    location: 'Reception area',
    notes: 'Welcome speech ready.',
  },
  {
    id: 'dinner',
    start: '18:00',
    durationMinutes: 120,
    title: 'Dinner service',
    owner: 'Caterer',
    location: 'Dining area',
    notes: 'Cake after the main course.',
  },
  {
    id: 'speeches',
    start: '20:00',
    durationMinutes: 45,
    title: 'Speeches and the couple dance',
    owner: 'Hosts',
    location: 'Reception area',
    notes: 'Three speakers, five minutes each.',
  },
  {
    id: 'farewell',
    start: '21:30',
    durationMinutes: 60,
    title: 'Farewell and transport home',
    owner: 'Transport',
    location: 'Entrance',
    notes: 'Keep taxis booked for the whole window.',
  },
];
