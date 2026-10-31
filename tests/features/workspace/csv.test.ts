import { describe, expect, it } from 'vitest';
import { budgetCsv, milestonesCsv, toCsv, vendorsCsv, withBom } from '@/features/workspace';
import { computeBudget } from '@/features/budget';
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

const VENDOR: Vendor = {
  id: 'v1',
  category: 'caterer',
  name: 'Sharma, Caterers',
  status: 'quoted',
  quotedMinor: 1_000_000,
  depositMinor: null,
  dueDate: '2026-11-01',
  phone: '',
  notes: '=SUM(A1:A9)',
};

describe('toCsv', () => {
  it('quotes every cell', () => {
    expect(toCsv([['a', 1]])).toBe('"a","1"');
  });

  it('doubles a quote inside a cell', () => {
    expect(toCsv([['say "hi"']])).toBe('"say ""hi"""');
  });

  it('defuses a formula so a spreadsheet cannot run it', () => {
    expect(toCsv([['=1+1']])).toBe('"\'=1+1"');
    expect(toCsv([['+1']])).toBe('"\'+1"');
    expect(toCsv([['-1']])).toBe('"\'-1"');
    expect(toCsv([['@x']])).toBe('"\'@x"');
  });

  it('leaves ordinary text alone', () => {
    expect(toCsv([['hello world']])).toBe('"hello world"');
  });
});

describe('withBom', () => {
  it('prepends a UTF-8 byte order mark', () => {
    expect(withBom('a').charCodeAt(0)).toBe(0xfeff);
  });
});

describe('budgetCsv', () => {
  it('lists every category and the totals', () => {
    const plan = createPlan(BASE, new Date());
    const csv = budgetCsv(plan, computeBudget(plan));
    expect(csv).toContain('Category');
    expect(csv).toContain('Food & drink');
    expect(csv).toContain('Contingency');
    expect(csv).toContain('Total');
  });

  it('keeps the minor-unit amount alongside the formatted amount', () => {
    const plan = createPlan(BASE, new Date());
    const csv = budgetCsv(plan, computeBudget(plan));
    expect(csv).toContain('10000000');
    expect(csv).toContain('₹100,000');
  });

  it('leaves per-guest cells empty when there are no guests', () => {
    const plan = createPlan({ ...BASE, guests: 0 }, new Date());
    const rows = budgetCsv(plan, computeBudget(plan)).split('\r\n');
    expect(rows.at(-1)).toBe('"Total","10000000","₹100,000","100","","",""');
  });
});

describe('milestonesCsv', () => {
  it('writes a row per milestone', () => {
    const plan = createPlan(BASE, new Date());
    const csv = milestonesCsv(plan);
    expect(csv.split('\r\n')).toHaveLength(1);
  });

  it('writes an unscheduled, completed milestone', () => {
    const plan = {
      ...createPlan(BASE, new Date()),
      milestones: [
        {
          id: 'm1',
          title: 'Book the venue',
          date: null,
          offsetDays: -10,
          done: true,
          owner: 'You',
          whyItMatters: 'It unlocks everything else.',
        },
      ],
    };
    const csv = milestonesCsv(plan);
    expect(csv).toContain('"Book the venue"');
    expect(csv).toContain('"not scheduled"');
    expect(csv).toContain('"10"');
    expect(csv).toContain('"yes"');
  });
});

describe('vendorsCsv', () => {
  it('defuses a formula in a notes cell', () => {
    const plan = { ...createPlan(BASE, new Date()), vendors: [VENDOR] };
    const csv = vendorsCsv(plan);
    expect(csv).toContain("'=SUM(A1:A9)");
  });

  it('leaves missing quotes and dates empty', () => {
    const plan = {
      ...createPlan(BASE, new Date()),
      vendors: [{ ...VENDOR, quotedMinor: null, dueDate: null, notes: '' }],
    };
    const row = vendorsCsv(plan).split('\r\n')[1];
    expect(row).toBe('"caterer","Sharma, Caterers","quoted","","",""');
  });
});
