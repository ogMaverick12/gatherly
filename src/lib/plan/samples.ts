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

/** A vendor in a sample plan. */
export interface SampleVendor {
  readonly category: VendorCategoryId;
  readonly name: string;
  readonly status: VendorStatus;
  readonly notes: string;
  readonly quotedMinor?: number;
}

/** A sample plan offered on the landing page. */
export interface SamplePlanTemplate {
  readonly id: string;
  readonly name: string;
  readonly tagline: string;
  readonly description: string;
  readonly daysFromNow: number;
  readonly intake: Intake;
  readonly tasks: readonly SampleTask[];
  readonly vendors: readonly SampleVendor[];
  /** Milestones that make the sample feel lived-in; the rest stay open. */
  readonly doneMilestones: readonly string[];
}

/**
 * The three one-click sample plans shown on the landing page.
 */
export const SAMPLE_PLAN_TEMPLATES: readonly SamplePlanTemplate[] = [
  {
    id: 'wedding',
    name: 'A 180-guest wedding',
    tagline: 'Daytime ceremony, evening reception, everything costed.',
    description:
      'A mid-size wedding in a tier 2 city, priced in Indian rupees, with food and photography as the priorities.',
    daysFromNow: 128,
    intake: WEDDING_INTAKE,
    doneMilestones: ['venue-shortlist', 'vendor-shortlist', 'catering-tasting', 'decor-confirm'],
    tasks: [
      { title: 'Confirm the ceremony and reception venues', area: 'vendors' },
      { title: 'Shortlist three caterers and ask for a tasting', area: 'catering' },
      { title: 'Book a photographer for both parts of the day', area: 'vendors' },
      { title: 'Collect final guest numbers and dietary notes', area: 'guest-experience' },
      { title: 'Agree the rain plan with both venues', area: 'logistics' },
      { title: 'Write the timeline for family and suppliers', area: 'timeline' },
    ],
    vendors: [
      {
        category: 'venue',
        name: 'Garden hall',
        status: 'booked',
        notes: 'Holds 220 seated.',
        quotedMinor: 37_000_000,
      },
      {
        category: 'caterer',
        name: 'Sharma Caterers',
        status: 'booked',
        notes: 'Two menus quoted.',
        quotedMinor: 38_000_000,
      },
      {
        category: 'photographer',
        name: 'Studio Aangan',
        status: 'booked',
        notes: 'Full day, two photographers.',
        quotedMinor: 16_000_000,
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
    doneMilestones: ['vendor-shortlist', 'catering-tasting', 'decor-confirm'],
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
        quotedMinor: 200_000,
      },
      {
        category: 'caterer',
        name: 'Harvest Table',
        status: 'booked',
        notes: 'Quote includes service staff.',
        quotedMinor: 280_000,
      },
      {
        category: 'photographer',
        name: 'Halo Studio',
        status: 'booked',
        notes: 'Three hours, second shooter optional.',
        quotedMinor: 100_000,
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
    doneMilestones: ['venue-shortlist', 'vendor-shortlist', 'catering-tasting', 'transport-plan'],
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
        quotedMinor: 70_000,
      },
      {
        category: 'caterer',
        name: 'Shared kitchen team',
        status: 'booked',
        notes: 'Kitchen hire and serving team confirmed.',
        quotedMinor: 200_000,
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
