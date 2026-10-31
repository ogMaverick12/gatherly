import { describe, expect, it } from 'vitest';
import { DEFAULT_INTAKE_VALUES, IntakeFormSchema } from '@/features/intake';

/** Parse the default form with a few fields changed. */
function parse(patch: Record<string, unknown>) {
  return IntakeFormSchema.safeParse({ ...DEFAULT_INTAKE_VALUES, ...patch });
}

/** The first message attached to a field, or null when the value is valid. */
function messageFor(patch: Record<string, unknown>, field: string): string | null {
  const result = parse(patch);
  if (result.success) return null;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message ?? null;
}

describe('the intake form schema', () => {
  it('accepts the defaults', () => {
    expect(parse({}).success).toBe(true);
  });

  it('does not inspect the date text when the date is not set', () => {
    expect(parse({ dateNotSet: true, eventDate: 'not a date' }).success).toBe(true);
  });

  it('rejects a date that is not in YYYY-MM-DD form', () => {
    expect(messageFor({ dateNotSet: false, eventDate: '05/12/2026' }, 'eventDate')).toBe(
      'Use the date picker.',
    );
  });

  it('rejects a calendar date that does not exist', () => {
    expect(messageFor({ dateNotSet: false, eventDate: '2026-02-30' }, 'eventDate')).toBe(
      'That date does not exist.',
    );
  });

  it('accepts a real calendar date', () => {
    expect(parse({ dateNotSet: false, eventDate: '2026-12-05' }).success).toBe(true);
  });

  it('rejects a guest count below one', () => {
    expect(messageFor({ guests: 0 }, 'guests')).toBe('At least one guest.');
  });

  it('rejects a guest count above the supported maximum', () => {
    expect(messageFor({ guests: 5001 }, 'guests')).toBe(
      'That is more than 5000 guests - is that right?',
    );
  });

  it('rejects a negative budget', () => {
    expect(messageFor({ budget: -1 }, 'budget')).toBe(
      'A budget of zero is allowed, but the plan will be thin.',
    );
  });

  it('rejects more than four priorities', () => {
    expect(
      messageFor(
        { priorities: ['photography', 'food', 'music', 'decor', 'logistics'] },
        'priorities',
      ),
    ).toBeTruthy();
  });

  it('rejects an unknown field', () => {
    expect(parse({ surprise: true }).success).toBe(false);
  });
});
