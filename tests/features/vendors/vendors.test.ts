import { describe, expect, it } from 'vitest';
import {
  buildWhatsAppLink,
  computeVendorCoverage,
  missingVendorCategories,
  nextStatus,
  normalisePhone,
  scoreQuote,
  vendorChecklist,
  vendorCoverageShare,
} from '@/features/vendors';
import type { Intake, Vendor } from '@/lib/plan';
import { makePlan, makeVendor as vendor } from '@tests/support/factories';

function planWith(vendors: Vendor[] = [], patch: Partial<Intake> = {}) {
  return { ...makePlan(patch), vendors };
}

describe('vendorChecklist', () => {
  it('lists the categories each event type needs', () => {
    expect(vendorChecklist('wedding')).toContain('caterer');
    expect(vendorChecklist('birthday')).not.toContain('officiant');
    expect(vendorChecklist('community')).toContain('transport');
  });

  it('reports the categories with no vendor at all', () => {
    const plan = planWith([vendor({ category: 'venue' })]);
    const missing = missingVendorCategories(plan);
    expect(missing).toContain('caterer');
    expect(missing).not.toContain('venue');
  });
});

describe('scoreQuote', () => {
  it('gives no credit for a quote that does not exist', () => {
    const assessment = scoreQuote(vendor(), 1_000_000, '2026-12-05');
    expect(assessment.score).toBeLessThan(50);
    expect(assessment.components.find((part) => part.id === 'budget-fit')?.earned).toBe(0);
  });

  it('rewards a complete, affordable, well-timed quote', () => {
    const assessment = scoreQuote(
      vendor({
        status: 'booked',
        quotedMinor: 500_000,
        depositMinor: 100_000,
        dueDate: '2026-11-01',
        notes: 'Two menus quoted',
      }),
      1_000_000,
      '2026-12-05',
    );
    expect(assessment.score).toBeGreaterThan(80);
  });

  it('penalises a quote that is over the budget line', () => {
    const over = scoreQuote(vendor({ quotedMinor: 2_000_000 }), 1_000_000, '2026-12-05');
    const within = scoreQuote(vendor({ quotedMinor: 500_000 }), 1_000_000, '2026-12-05');
    expect(over.score).toBeLessThan(within.score);
  });

  it('scores the four published components to 100', () => {
    const assessment = scoreQuote(vendor(), 1_000_000, '2026-12-05');
    const max = assessment.components.reduce((sum, part) => sum + part.max, 0);
    expect(max).toBe(100);
  });
});

describe('computeVendorCoverage', () => {
  const allocation = {
    venue: 1_000_000,
    catering: 1_000_000,
    photography: 500_000,
    decor: 500_000,
    music: 200_000,
    attire: 200_000,
    transport: 150_000,
    stationery: 100_000,
    entertainment: 100_000,
    officiant: 200_000,
    accommodation: 200_000,
    gifts: 100_000,
  };

  it('reports zero coverage when nothing is booked', () => {
    const coverage = computeVendorCoverage(planWith(), allocation);
    expect(coverage.overallPercent).toBe(0);
    expect(coverage.outstandingCount).toBe(0);
  });

  it('counts the vendors that are still open', () => {
    const coverage = computeVendorCoverage(planWith([vendor()]), allocation);
    expect(coverage.outstandingCount).toBe(1);
  });

  it('counts a booked vendor against the budget line', () => {
    const coverage = computeVendorCoverage(
      planWith([vendor({ category: 'caterer', status: 'booked', quotedMinor: 1_000_000 })]),
      allocation,
    );
    const catering = coverage.categories.find((category) => category.category === 'caterer');
    expect(catering?.coveragePercent).toBe(100);
    expect(coverage.bookedMinor).toBe(1_000_000);
  });

  it('names a next action while something is outstanding', () => {
    const coverage = computeVendorCoverage(planWith([vendor()]), allocation);
    expect(coverage.nextAction).toContain('Sharma Caterers');
  });

  it('reports the stage of a category that has been quoted but not booked', () => {
    const coverage = computeVendorCoverage(
      planWith([vendor({ category: 'caterer', status: 'quoted', quotedMinor: 100_000 })]),
      allocation,
    );
    const catering = coverage.categories.find((category) => category.category === 'caterer');
    expect(catering?.status).toBe('quoted');
  });

  it('reports the stage of a category that has only been contacted', () => {
    const coverage = computeVendorCoverage(
      planWith([vendor({ category: 'caterer', status: 'contacted' })]),
      allocation,
    );
    const catering = coverage.categories.find((category) => category.category === 'caterer');
    expect(catering?.status).toBe('contacted');
  });

  it('reports a category with no vendor at all as not started', () => {
    const coverage = computeVendorCoverage(planWith(), allocation);
    const music = coverage.categories.find((category) => category.category === 'music');
    expect(music?.status).toBe('not-started');
  });

  it('counts a booked deposit when there is no quote', () => {
    const coverage = computeVendorCoverage(
      planWith([vendor({ category: 'caterer', status: 'booked', depositMinor: 250_000 })]),
      allocation,
    );
    expect(coverage.bookedMinor).toBe(250_000);
  });

  it('counts a booked vendor at full coverage when the line has no allocation', () => {
    const coverage = computeVendorCoverage(
      planWith([vendor({ category: 'caterer', status: 'booked', quotedMinor: 250_000 })]),
      {},
    );
    const catering = coverage.categories.find((category) => category.category === 'caterer');
    expect(catering?.coveragePercent).toBe(100);
  });
});

describe('normalisePhone', () => {
  it('keeps a full international number', () => {
    expect(normalisePhone('+91 98765 43210')).toBe('+919876543210');
  });

  it('converts a 00 prefix', () => {
    expect(normalisePhone('0044 7700 900123')).toBe('+447700900123');
  });

  it('rejects a number that is too short', () => {
    expect(normalisePhone('123')).toBeNull();
  });

  it('rejects an empty number', () => {
    expect(normalisePhone('   ')).toBeNull();
  });
});

describe('buildWhatsAppLink', () => {
  it('builds a wa.me link with a message', () => {
    const link = buildWhatsAppLink(vendor({ phone: '+919876543210' }), 'a wedding');
    expect(link.href).toContain('https://wa.me/919876543210?text=');
    expect(link.message).toContain('a wedding');
    expect(link.reason).toBeNull();
  });

  it('explains why there is no link when the number is missing', () => {
    const link = buildWhatsAppLink(vendor(), 'a wedding');
    expect(link.href).toBeNull();
    expect(link.reason).toContain('phone number');
  });
});

describe('nextStatus', () => {
  it('moves along the checklist', () => {
    expect(nextStatus('to_contact')).toBe('contacted');
    expect(nextStatus('quoted')).toBe('booked');
  });

  it('restarts a passed vendor', () => {
    expect(nextStatus('declined')).toBe('to_contact');
  });

  it('stops at the last step', () => {
    expect(nextStatus('booked')).toBe('booked');
  });

  it('never returns a status outside the published list', () => {
    const statuses = ['to_contact', 'contacted', 'quoted', 'booked', 'declined'] as const;
    for (const status of statuses) {
      expect(statuses).toContain(nextStatus(status));
    }
  });
});

describe('vendorCoverageShare', () => {
  it('reports the booked share of one category', () => {
    const coverage = computeVendorCoverage(
      planWith([vendor({ category: 'caterer', status: 'booked', quotedMinor: 250_000 })]),
      {
        catering: 1_000_000,
      },
    );
    expect(vendorCoverageShare(coverage, 'caterer')).toBe(25);
  });

  it('reports zero for a category that is not in the plan', () => {
    const coverage = computeVendorCoverage(planWith(), {});
    expect(vendorCoverageShare(coverage, 'music')).toBe(0);
  });
});
