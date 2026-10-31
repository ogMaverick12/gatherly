import { describe, expect, it } from 'vitest';
import { computeCatering, BUFFER_PERCENT } from '@/features/catering';
import { createPlan, type Intake, type Vendor } from '@/lib/plan';

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

function planWith(patch: Partial<Intake> = {}, vendors: Vendor[] = []) {
  return { ...createPlan({ ...BASE, ...patch }, new Date()), vendors };
}

describe('computeCatering', () => {
  it('adds a percentage buffer to the plate count', () => {
    const catering = computeCatering(planWith());
    expect(catering.mainPlates).toBe(100);
    expect(catering.bufferPlates).toBe(Math.ceil((100 * BUFFER_PERCENT) / 100));
    expect(catering.totalPlates).toBe(108);
  });

  it('scales the plate count with the guest count', () => {
    const catering = computeCatering(planWith({ guests: 250 }));
    expect(catering.bufferPlates).toBe(20);
    expect(catering.totalPlates).toBe(270);
  });

  it('adds one server for every 25 guests plus two for the room', () => {
    const catering = computeCatering(planWith({ guests: 100 }));
    expect(catering.servers).toBe(6);
    expect(catering.leadStaff).toBe(1);
  });

  it('gives more drinks to a longer service', () => {
    const short = computeCatering(planWith({ eventType: 'birthday', guests: 100 }));
    const long = computeCatering(planWith({ eventType: 'wedding', guests: 100 }));
    expect(long.drinks).toBeGreaterThan(short.drinks);
  });

  it('turns each dietary need into an instruction for the caterer', () => {
    const catering = computeCatering(planWith({ dietary: ['vegan', 'halal'] }));
    expect(catering.dietary).toHaveLength(2);
    expect(catering.dietary[0]?.action).toContain('caterer');
    expect(catering.dietary[0]?.confirmed).toBe(false);
  });

  it('marks a dietary need confirmed once the caterer has notes', () => {
    const catering = computeCatering(
      planWith({ dietary: ['vegan'] }, [
        {
          id: 'v1',
          category: 'caterer',
          name: 'Caterer',
          status: 'quoted',
          quotedMinor: null,
          depositMinor: null,
          dueDate: null,
          phone: '',
          notes: 'Vegan menu confirmed in writing.',
        },
      ]),
    );
    expect(catering.dietary[0]?.confirmed).toBe(true);
  });

  it('warns that an estimated guest count will move', () => {
    const catering = computeCatering(planWith({ guestCountIsEstimate: true }));
    expect(catering.notes.join(' ')).toContain('estimate');
  });

  it('asks about dietary needs even when none were recorded', () => {
    const catering = computeCatering(planWith());
    expect(catering.notes.join(' ')).toContain('Ask anyway');
  });

  it('adds a note for an outdoor event', () => {
    const catering = computeCatering(planWith({ venueType: 'outdoor' }));
    expect(catering.notes.join(' ')).toContain('shade');
  });
});
