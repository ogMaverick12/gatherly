import type { TaskArea, VendorCategoryId, VendorStatus } from './categories';
import { BIRTHDAY_INTAKE, COMMUNITY_INTAKE, WEDDING_INTAKE } from './sample-intakes';
import type { Intake } from './schemas';

/**
 * Three one-click starting points, one per event family, each in a different
 * currency so the "no FX" model is visible from the start.
 */

export interface SampleTask {
  readonly title: string;
  readonly area: TaskArea;
}

export interface SampleVendor {
  readonly category: VendorCategoryId;
  readonly name: string;
  readonly status: VendorStatus;
  readonly notes: string;
}

export interface SamplePlanTemplate {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly daysFromNow: number;
  readonly intake: Intake;
  readonly tasks: readonly SampleTask[];
  readonly vendors: readonly SampleVendor[];
}

export const SAMPLE_PLAN_TEMPLATES: readonly SamplePlanTemplate[] = [
  {
    id: 'wedding',
    name: 'A 180-guest wedding',
    tagline: 'Daytime ceremony, evening reception, everything costed.',
    description:
      'A mid-size wedding in a tier 2 city, priced in Indian rupees, with food and photography as the priorities.',
    daysFromNow: 128,
    intake: WEDDING_INTAKE,
    tasks: [
      { title: 'Confirm the ceremony and reception venues', area: 'vendors' },
      { title: 'Shortlist three caterers and ask for a tasting', area: 'catering' },
      { title: 'Book a photographer for both parts of the day', area: 'vendors' },
      { title: 'Collect final guest numbers and dietary notes', area: 'guest-experience' },
      { title: 'Agree the rain plan with both venues', area: 'logistics' },
      { title: 'Write the timeline for family and suppliers', area: 'timeline' },
    ],
    vendors: [
      { category: 'venue', name: 'Garden hall', status: 'booked', notes: 'Holds 220 seated.' },
      {
        category: 'caterer',
        name: 'Sharma Caterers',
        status: 'quoted',
        notes: 'Two menus quoted.',
      },
      {
        category: 'photographer',
        name: 'Studio Aangan',
        status: 'contacted',
        notes: 'Awaiting the full-day quote.',
      },
      { category: 'decorator', name: '', status: 'to_contact', notes: '' },
      { category: 'music', name: '', status: 'to_contact', notes: '' },
      { category: 'transport', name: '', status: 'to_contact', notes: '' },
    ],
  },
  {
    id: 'birthday',
    name: 'A 60-guest garden birthday',
    tagline: 'An afternoon party that moves indoors at sunset.',
    description:
      'A tier 1 city birthday in US dollars, with photography, food and decor as the priorities and a nut-free requirement.',
    daysFromNow: 46,
    intake: BIRTHDAY_INTAKE,
    tasks: [
      { title: 'Confirm the garden venue and the indoor wet-weather plan', area: 'vendors' },
      { title: 'Order the cake and confirm the nut-free note', area: 'catering' },
      { title: 'Book the photographer for three hours', area: 'vendors' },
      { title: 'Confirm the step-free route from the car park', area: 'accessibility' },
      { title: 'Send invitations with the date, time and dress note', area: 'guest-experience' },
    ],
    vendors: [
      {
        category: 'venue',
        name: 'Botanical garden room',
        status: 'booked',
        notes: 'Wet-weather room held until Friday.',
      },
      {
        category: 'caterer',
        name: 'Harvest Table',
        status: 'quoted',
        notes: 'Quote includes service staff.',
      },
      {
        category: 'photographer',
        name: 'Halo Studio',
        status: 'booked',
        notes: 'Three hours, second shooter optional.',
      },
      { category: 'decorator', name: '', status: 'contacted', notes: '' },
      { category: 'music', name: '', status: 'to_contact', notes: '' },
    ],
  },
  {
    id: 'community',
    name: 'A 240-guest community feast',
    tagline: 'Shared tables, a shared kitchen, a neighbourhood-scale budget.',
    description:
      'A community gathering in pounds, with accessibility and logistics as the priorities and a shared-meal pack already selected.',
    daysFromNow: 74,
    intake: COMMUNITY_INTAKE,
    tasks: [
      { title: 'Confirm the hall and the step-free entrance', area: 'vendors' },
      { title: 'Agree the shared-kitchen schedule', area: 'catering' },
      { title: 'Set up the hearing loop and check it works', area: 'accessibility' },
      { title: 'Publish the dish contribution list', area: 'guest-experience' },
      { title: 'Plan the waste and recycling points', area: 'sustainability' },
      { title: 'Recruit six volunteers for the serving rota', area: 'logistics' },
    ],
    vendors: [
      {
        category: 'venue',
        name: 'Borough hall',
        status: 'booked',
        notes: 'Hall and kitchen both confirmed.',
      },
      {
        category: 'caterer',
        name: 'Shared kitchen team',
        status: 'contacted',
        notes: 'Confirming kitchen hire.',
      },
      { category: 'photographer', name: '', status: 'to_contact', notes: '' },
      {
        category: 'decorator',
        name: 'Volunteer team',
        status: 'to_contact',
        notes: 'Decor is community-made.',
      },
      { category: 'transport', name: '', status: 'to_contact', notes: '' },
      { category: 'officiant', name: '', status: 'to_contact', notes: 'A host is still needed.' },
    ],
  },
] as const;
