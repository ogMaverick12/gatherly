import { describe, expect, it } from 'vitest';
import { computeVendorCoverage, nextStatus, vendorCoverageShare } from '@/features/vendors';
import { asInvalid, makePlan } from '@tests/support/factories';

describe('vendor status transitions', () => {
  it('restarts a status the current workflow does not recognise', () => {
    expect(nextStatus(asInvalid('archived'))).toBe('to_contact');
  });
});

describe('vendor coverage share', () => {
  it('returns zero for a category the event never plans for', () => {
    const coverage = computeVendorCoverage(makePlan({ eventType: 'birthday' }), {});

    expect(vendorCoverageShare(coverage, 'officiant')).toBe(0);
  });
});
