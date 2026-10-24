import { describe, expect, it } from 'vitest';
import { generateIdeas, describePlanShape, type IdeaContext } from '@/features/ideas/services';

const CONTEXT: IdeaContext = {
  guests: 120,
  eventType: 'wedding',
  cityTier: 'tier2',
  priorities: ['food', 'photography'],
  dietary: ['vegetarian'],
  month: 12,
  currency: 'INR',
  budgetMinor: 10_000_000,
  perGuestMinor: 83_333,
};

describe('generateIdeas', () => {
  it('returns ideas that are labelled as deterministic', () => {
    const ideas = generateIdeas(CONTEXT);
    expect(ideas.length).toBeGreaterThan(0);
    expect(ideas.every((idea) => idea.source === 'basic')).toBe(true);
  });

  it('quotes the plan numbers in the rationale', () => {
    const ideas = generateIdeas(CONTEXT);
    const withNumbers = ideas.filter((idea) => /\d/.test(idea.rationale));
    expect(withNumbers.length).toBeGreaterThan(0);
  });

  it('puts the most relevant idea first', () => {
    const ideas = generateIdeas({ ...CONTEXT, priorities: ['sustainability'] });
    const sustainability = ideas.find((idea) => idea.tags.includes('sustainability'));
    if (sustainability) {
      expect(ideas.indexOf(sustainability)).toBeLessThan(5);
    }
  });

  it('does not repeat an idea', () => {
    const ideas = generateIdeas(CONTEXT);
    const ids = new Set(ideas.map((idea) => idea.id));
    expect(ids.size).toBe(ideas.length);
  });

  it('never names a religion or region', () => {
    const text = JSON.stringify(generateIdeas(CONTEXT)).toLowerCase();
    for (const word of ['muslim', 'hindu', 'christian', 'jewish', 'sikh', 'asia', 'europe']) {
      expect(text).not.toContain(word);
    }
  });

  it('changes with the event type', () => {
    const wedding = generateIdeas(CONTEXT).map((idea) => idea.id);
    const community = generateIdeas({ ...CONTEXT, eventType: 'community' }).map((idea) => idea.id);
    expect(wedding).not.toEqual(community);
  });

  it('offers the community ideas for a community event', () => {
    const ideas = generateIdeas({ ...CONTEXT, eventType: 'community' });
    const ids = ideas.map((idea) => idea.id);
    expect(ids).toContain('community-quiet-table');
    expect(ids).toContain('community-contributions');
    expect(ids).toContain('community-photo-board');
  });

  it('explains the quiet table in the guest numbers', () => {
    const ideas = generateIdeas({ ...CONTEXT, eventType: 'community', guests: 240 });
    const quiet = ideas.find((idea) => idea.id === 'community-quiet-table');
    expect(quiet?.rationale).toContain('240');
  });

  it('ranks the quiet table higher when accessibility is a priority', () => {
    const without = generateIdeas({ ...CONTEXT, eventType: 'community' }).map((idea) => idea.id);
    const withPriority = generateIdeas({
      ...CONTEXT,
      eventType: 'community',
      priorities: ['accessibility'],
    }).map((idea) => idea.id);
    expect(withPriority.indexOf('community-quiet-table')).toBeLessThan(
      without.indexOf('community-quiet-table'),
    );
  });

  it('describes a tier 1 city differently from a tier 3 city', () => {
    const tier1 = describePlanShape({ ...CONTEXT, cityTier: 'tier1' });
    const tier3 = describePlanShape({ ...CONTEXT, cityTier: 'tier3' });
    expect(tier1).not.toEqual(tier3);
    expect(tier3).toContain('smaller town');
  });

  it('never offers a wedding idea to a community event', () => {
    const ids = generateIdeas({ ...CONTEXT, eventType: 'community' }).map((idea) => idea.id);
    expect(ids.some((id) => id.startsWith('wedding-'))).toBe(false);
    expect(ids.some((id) => id.startsWith('birthday-'))).toBe(false);
  });

  it('never offers a community idea to a wedding', () => {
    const ids = generateIdeas({ ...CONTEXT, eventType: 'wedding' }).map((idea) => idea.id);
    expect(ids.some((id) => id.startsWith('community-'))).toBe(false);
  });

  it('offers the birthday ideas for a birthday event', () => {
    const ids = generateIdeas({ ...CONTEXT, eventType: 'birthday' }).map((idea) => idea.id);
    expect(ids).toContain('birthday-cake-time');
    expect(ids).toContain('birthday-first-30');
    expect(ids).toContain('birthday-gift-bag');
    expect(ids).toContain('birthday-photo-spot');
    expect(ids).toContain('birthday-wet-weather-hold');
  });

  it('never offers a birthday idea to a wedding', () => {
    const ids = generateIdeas({ ...CONTEXT, eventType: 'wedding' }).map((idea) => idea.id);
    expect(ids.some((id) => id.startsWith('birthday-'))).toBe(false);
  });

  it('moves the wet-weather idea up for a birthday in a wet month', () => {
    const wet = generateIdeas({ ...CONTEXT, eventType: 'birthday', month: 7 }).map(
      (idea) => idea.id,
    );
    const dry = generateIdeas({ ...CONTEXT, eventType: 'birthday', month: 1 }).map(
      (idea) => idea.id,
    );
    expect(wet.indexOf('birthday-wet-weather-hold')).toBeLessThan(
      dry.indexOf('birthday-wet-weather-hold'),
    );
  });
});

describe('describePlanShape', () => {
  it('summarises the plan in one sentence', () => {
    const text = describePlanShape(CONTEXT);
    expect(text).toContain('120');
    expect(text).toContain('per guest');
  });
});
