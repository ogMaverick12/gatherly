import { describe, expect, it } from 'vitest';
import { extractJson } from '@/lib/ai/json';

describe('extractJson', () => {
  it('reads a fenced answer with a language tag', () => {
    expect(extractJson('```json\n{"ideas":[]}\n```')).toEqual({ ideas: [] });
  });

  it('reads a fenced answer with prose around it', () => {
    expect(
      extractJson('Here is the JSON:\n```\n{"eventType":"wedding"}\n```\nHope that helps.'),
    ).toEqual({ eventType: 'wedding' });
  });

  it('reads an unfenced answer', () => {
    expect(extractJson('  {"guests": 120}  ')).toEqual({ guests: 120 });
  });

  it('returns null for junk instead of throwing', () => {
    expect(extractJson('no json here')).toBeNull();
    expect(extractJson('{"unterminated": ')).toBeNull();
    expect(extractJson('```json\nnot json\n```')).toBeNull();
  });
});
