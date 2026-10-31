import { describe, expect, it } from 'vitest';
import { parseFreeText } from '@/features/assistant';
import { parseBudget } from '@/features/assistant/parse-budget';
import { parseEventDate } from '@/features/assistant/parse-dates';

describe('parseFreeText', () => {
  it('extracts the event type', () => {
    expect(parseFreeText('We are planning a wedding').eventType).toBe('wedding');
    expect(parseFreeText('a birthday party').eventType).toBe('birthday');
    expect(parseFreeText('a community gathering').eventType).toBe('community');
  });

  it('extracts a date in several formats', () => {
    expect(parseFreeText('on 2026-12-05').eventDate).toBe('2026-12-05');
    expect(parseFreeText('on 05/12/2026').eventDate).toBe('2026-12-05');
    expect(parseFreeText('on 5 December 2026').eventDate).toBe('2026-12-05');
    expect(parseFreeText('on December 5, 2026').eventDate).toBe('2026-12-05');
  });

  it('leaves the date empty when there is none', () => {
    expect(parseFreeText('sometime next year').eventDate).toBeNull();
  });

  it('extracts a guest count', () => {
    expect(parseFreeText('about 120 guests are coming').guests).toBe(120);
  });

  it('leaves the guest count empty rather than guessing', () => {
    expect(parseFreeText('a nice gathering').guests).toBeNull();
  });

  it('extracts a budget and its currency', () => {
    const parsed = parseFreeText('our budget is ₹5,00,000 for the whole thing');
    expect(parsed.currency).toBe('INR');
    expect(parsed.budgetMinor).toBe(50_000_000);
  });

  it('extracts a dollar budget', () => {
    const parsed = parseFreeText('budget $12,000 total');
    expect(parsed.currency).toBe('USD');
    expect(parsed.budgetMinor).toBe(1_200_000);
  });

  it('leaves the budget empty when there is none', () => {
    expect(parseFreeText('no numbers yet').budgetMinor).toBeNull();
    expect(parseFreeText('no numbers yet').currency).toBeNull();
  });

  it('extracts up to four priorities', () => {
    const parsed = parseFreeText(
      'photography, food, music, decor and transport matter most, plus sustainability and simplicity',
    );
    expect(parsed.priorities).toHaveLength(4);
    expect(parsed.priorities).toContain('photography');
  });

  it('extracts dietary needs', () => {
    const parsed = parseFreeText('we need vegan and gluten free options');
    expect(parsed.dietary).toContain('vegan');
    expect(parsed.dietary).toContain('gluten-free');
  });

  it('extracts access needs', () => {
    const parsed = parseFreeText('we need wheelchair access and a hearing loop');
    expect(parsed.access).toContain('wheelchair');
    expect(parsed.access).toContain('hearing-loop');
  });

  it('never returns a field about religion, community or region', () => {
    const parsed = parseFreeText('a wedding for a Muslim family in Kerala');
    expect(Object.keys(parsed)).not.toContain('religion');
    expect(Object.keys(parsed)).not.toContain('region');
    expect(parsed.notes).toContain('Muslim');
    expect(JSON.stringify(parsed).toLowerCase()).not.toContain('hindu');
  });

  it('keeps the original text as the note', () => {
    expect(parseFreeText('  A small wedding  ').notes).toBe('A small wedding');
  });
});

describe('date and budget readers', () => {
  it.each(['2026-02-30', '31/02/2026', '31 February 2026', '31 Flux 2026'])(
    'rejects the impossible date %s',
    (text) => {
      expect(parseEventDate(text)).toBeNull();
    },
  );

  it('reads a currency amount written after the word budget', () => {
    expect(parseBudget('budget 20,000 usd')).toEqual({
      currency: 'USD',
      amountMinor: 2_000_000,
    });
  });

  it('returns nothing when there is no currency or no positive amount', () => {
    expect(parseBudget('forty people')).toBeNull();
    expect(parseBudget('we have dollars but no number')).toBeNull();
    expect(parseBudget('usd 0')).toBeNull();
  });
});
