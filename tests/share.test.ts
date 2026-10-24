import { describe, expect, it } from 'vitest';
import {
  buildShareUrl,
  decodeShareFragment,
  encodeShareFragment,
  toSharePayload,
} from '@/lib/share';
import { createPlan, type Intake } from '@/lib/plan';

const BASE: Intake = {
  eventType: 'wedding',
  eventDate: '2026-12-05',
  guests: 100,
  cityTier: 'tier2',
  currency: 'INR',
  budgetMinor: 10_000_000,
  priorities: ['food'],
  cultureNote: '',
  dietary: ['vegetarian'],
  access: [],
  language: 'en',
  packs: [],
  venueType: 'indoor',
  guestCountIsEstimate: false,
  notes: '',
};

describe('share payloads', () => {
  it('carries the intake, tasks, vendors and milestones only', () => {
    const plan = {
      ...createPlan(BASE, new Date()),
      chat: [
        {
          id: 'c1',
          role: 'assistant' as const,
          content: 'private',
          mode: 'basic' as const,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    const payload = toSharePayload(plan);
    expect(payload).not.toHaveProperty('chat');
    expect(payload).not.toHaveProperty('ideas');
    expect(payload.intake.guests).toBe(100);
  });
});

describe('encode and decode', () => {
  it('round-trips a plan through the fragment', async () => {
    const plan = createPlan(BASE, new Date());
    const fragment = await encodeShareFragment(plan);
    const decoded = await decodeShareFragment(fragment);

    expect(decoded).not.toBeNull();
    expect(decoded?.intake.guests).toBe(100);
    expect(decoded?.intake.currency).toBe('INR');
  });

  it('produces a URL-safe fragment', async () => {
    const plan = createPlan(BASE, new Date());
    const fragment = await encodeShareFragment(plan);
    expect(fragment).toMatch(/^g1[zj]\.[A-Za-z0-9_-]+$/);
  });

  it('keeps the fragment out of the path', async () => {
    const plan = createPlan(BASE, new Date());
    const fragment = await encodeShareFragment(plan);
    const url = buildShareUrl('https://gatherly.example', fragment);
    expect(url).toContain('/plan#');
    expect(url.split('#')[0]).toBe('https://gatherly.example/plan');
  });

  it('rejects a fragment that is not a share link', async () => {
    expect(await decodeShareFragment('nonsense')).toBeNull();
    expect(await decodeShareFragment('')).toBeNull();
    expect(await decodeShareFragment('g1j.!!!not-base64!!!')).toBeNull();
  });

  it('rejects a share link with an unknown version', async () => {
    expect(await decodeShareFragment('g9j.eyJ2IjoyfQ')).toBeNull();
  });

  it('rejects a share link whose payload does not match the schema', async () => {
    const payload = Buffer.from(JSON.stringify({ v: 1, intake: { guests: 'many' } })).toString(
      'base64url',
    );
    expect(await decodeShareFragment(`g1j.${payload}`)).toBeNull();
  });

  it('accepts a fragment with a leading hash', async () => {
    const plan = createPlan(BASE, new Date());
    const fragment = await encodeShareFragment(plan);
    expect(await decodeShareFragment(`#${fragment}`)).not.toBeNull();
  });

  it('uses the compressed form when the browser can compress', async () => {
    // Compression only pays off for a plan with some bulk in it.
    const plan = createPlan(BASE, new Date());
    const bulky = {
      ...plan,
      tasks: Array.from({ length: 120 }, (_, index) => ({
        id: `task_${index}`,
        title: `Task number ${index} for a very busy celebration`,
        done: false,
        area: 'general' as const,
      })),
    };
    const fragment = await encodeShareFragment(bulky);
    expect(fragment).toMatch(/^g1z\./);
    expect((await decodeShareFragment(fragment))?.tasks.length).toBe(120);
  });

  it('falls back to plain JSON when the browser cannot compress', async () => {
    const plan = createPlan(BASE, new Date());
    const original = globalThis.CompressionStream;
    // @ts-expect-error - removing the API on purpose
    delete globalThis.CompressionStream;
    try {
      const fragment = await encodeShareFragment(plan);
      expect(fragment).toMatch(/^g1j\./);
      expect((await decodeShareFragment(fragment))?.intake.guests).toBe(100);
    } finally {
      globalThis.CompressionStream = original;
    }
  });

  it('rejects a compressed fragment that cannot be inflated', async () => {
    const body = Buffer.from('not compressed at all').toString('base64url');
    expect(await decodeShareFragment(`g1z.${body}`)).toBeNull();
  });

  it('rejects a fragment whose body is not JSON', async () => {
    const body = Buffer.from('this is not json').toString('base64url');
    expect(await decodeShareFragment(`g1j.${body}`)).toBeNull();
  });

  it('rejects a fragment with no body', async () => {
    expect(await decodeShareFragment('g1j.')).toBeNull();
  });

  it('rejects a payload that is not an object', async () => {
    const body = Buffer.from('"just a string"').toString('base64url');
    expect(await decodeShareFragment(`g1j.${body}`)).toBeNull();
  });

  it('drops the chat and the ideas from a shared plan', async () => {
    const plan = createPlan(BASE, new Date());
    const fragment = await encodeShareFragment(plan);
    const decoded = await decodeShareFragment(fragment);
    expect(decoded?.chat).toEqual([]);
    expect(decoded?.ideas).toEqual([]);
  });
});
