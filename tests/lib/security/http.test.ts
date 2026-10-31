import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ChatRequestSchema } from '@/lib/api-schema';
import { HttpError } from '@/lib/security/guards';
import { errorResponse, MAX_BODY_BYTES, readJsonBody } from '@/lib/security/http';

const Schema = z.object({ name: z.string().min(1).max(20) });

function jsonRequest(body: string): Request {
  return new Request('https://gatherly.test/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}

/** A chat body whose only invalid part is one array far beyond its maximum. */
function oversizedArrayBody(): string {
  const snapshot = {
    eventType: 'wedding',
    eventDate: null,
    guests: 100,
    cityTier: 'tier2',
    currency: 'INR',
    budgetMinor: 10_000_000,
    contingencyMinor: 1_000_000,
    perGuestMinor: 100_000,
    categories: [],
    healthScore: 50,
    healthBand: 'attention',
    nextMilestone: null,
    nextMilestoneDate: null,
    overdueCount: 0,
    milestonesDone: 0,
    milestonesTotal: 0,
    vendorCoveragePercent: 0,
    outstandingVendors: Array.from({ length: 1600 }, () => 'vendor'),
    plates: 0,
    drinks: 0,
    dietary: [],
    tasksDone: 0,
    tasksTotal: 0,
    topRisks: [],
  };
  return JSON.stringify({ message: 'hi', planSummary: 'x', snapshot });
}

describe('the JSON body boundary', () => {
  it('keeps the validation error body shape exact', async () => {
    let caught: unknown;
    try {
      await readJsonBody(jsonRequest(JSON.stringify({ name: '' })), Schema);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(HttpError);
    const response = errorResponse(caught);
    await expect(response.json()).resolves.toEqual({
      error: 'Please check the values you sent.',
      details: { fields: [{ path: 'name', message: expect.any(String) }] },
    });
  });

  it('rejects a long array under 16 KiB quickly and without a heap spike', async () => {
    const body = oversizedArrayBody();
    expect(new TextEncoder().encode(body).byteLength).toBeLessThan(MAX_BODY_BYTES);
    expect(new TextEncoder().encode(body).byteLength).toBeGreaterThan(MAX_BODY_BYTES - 2048);

    const before = process.memoryUsage().heapUsed;
    const started = performance.now();
    let caught: unknown;
    try {
      await readJsonBody(jsonRequest(body), ChatRequestSchema);
    } catch (error) {
      caught = error;
    }
    const elapsed = performance.now() - started;
    const heapGrowth = process.memoryUsage().heapUsed - before;

    expect(caught).toBeInstanceOf(HttpError);
    expect(elapsed).toBeLessThan(200);
    expect(heapGrowth).toBeLessThan(50 * 1024 * 1024);
  });
});
