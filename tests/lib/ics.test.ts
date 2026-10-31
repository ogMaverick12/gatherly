import { describe, expect, it } from 'vitest';
import { buildCalendar } from '@/lib/ics';
import { createPlan, type Intake, type Milestone } from '@/lib/plan';

const BASE: Intake = {
  eventType: 'wedding',
  eventDate: '2026-12-05',
  guests: 100,
  cityTier: 'tier2',
  currency: 'INR',
  budgetMinor: 10_000_000,
  priorities: [],
  cultureNote: '',
  dietary: [],
  access: [],
  language: 'en',
  packs: [],
  venueType: 'indoor',
  guestCountIsEstimate: false,
  notes: '',
};

const MILESTONE: Milestone = {
  id: 'm1',
  title: 'Book the venue; confirm the flowers',
  date: '2026-11-01',
  offsetDays: -34,
  done: false,
  owner: 'You',
  whyItMatters: 'Flowers, and, commas, are escaped.',
};

describe('buildCalendar', () => {
  it('wraps the output in a VCALENDAR', () => {
    const plan = createPlan(BASE, new Date());
    const ics = buildCalendar(plan);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
  });

  it('uses a date-only value for the event', () => {
    const plan = createPlan(BASE, new Date());
    const ics = buildCalendar(plan);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261205');
  });

  it('writes one event per dated milestone', () => {
    const plan = { ...createPlan(BASE, new Date()), milestones: [MILESTONE] };
    const ics = buildCalendar(plan);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(2);
    expect(ics).toContain('DTSTART;VALUE=DATE:20261101');
  });

  it('skips a milestone with no date', () => {
    const plan = {
      ...createPlan(BASE, new Date()),
      milestones: [{ ...MILESTONE, date: null }],
    };
    const ics = buildCalendar(plan);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });

  it('escapes commas, semicolons and newlines in text', () => {
    const plan = { ...createPlan(BASE, new Date()), milestones: [MILESTONE] };
    const ics = buildCalendar(plan);
    expect(ics).toContain('Book the venue\\; confirm the flowers');
    expect(ics).toContain('commas\\, are escaped');
  });

  it('folds long lines to 75 characters', () => {
    const plan = {
      ...createPlan(BASE, new Date()),
      milestones: [{ ...MILESTONE, whyItMatters: 'x'.repeat(200) }],
    };
    const ics = buildCalendar(plan);
    for (const line of ics.split('\r\n')) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
  });

  it('folds on octets, so non-Latin lines stay inside the limit', () => {
    const plan = {
      ...createPlan(BASE, new Date()),
      milestones: [{ ...MILESTONE, title: 'शादी की तैयारी और मेहमानों की सूची'.repeat(6) }],
    };
    const ics = buildCalendar(plan);
    for (const line of ics.split('\r\n')) {
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    }
  });

  it('does not split a character across two lines', () => {
    const plan = {
      ...createPlan(BASE, new Date()),
      milestones: [{ ...MILESTONE, title: 'शादी'.repeat(40) }],
    };
    const ics = buildCalendar(plan);
    const unfolded = ics.split('\r\n').map((line) => line.replace(/^ /, ''));
    expect(unfolded.join('')).toContain('शादी'.repeat(40));
  });

  it('uses CRLF line endings', () => {
    const plan = createPlan(BASE, new Date());
    expect(buildCalendar(plan)).toContain('\r\n');
  });
});
