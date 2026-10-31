import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useVendorDraft } from '@/features/workspace/components/vendors/use-vendor-draft';
import { makeVendor as vendor } from '@tests/support/factories';

describe('the vendor quote draft', () => {
  it('clears a quote when the field is left blank', () => {
    const vendorRecord = vendor({ quotedMinor: 100_000 });
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useVendorDraft(vendorRecord, 'INR', onUpdate));

    act(() => {
      result.current.setQuote('   ');
    });
    act(() => {
      result.current.commitQuote();
    });

    expect(onUpdate).toHaveBeenCalledWith(vendorRecord.id, { quotedMinor: null });
  });

  it('restores the saved quote when the typed value is not a number', () => {
    const vendorRecord = vendor({ quotedMinor: 100_000 });
    const onUpdate = vi.fn();
    const { result } = renderHook(() => useVendorDraft(vendorRecord, 'INR', onUpdate));

    act(() => {
      result.current.setQuote('not a number');
    });
    act(() => {
      result.current.commitQuote();
    });

    expect(onUpdate).not.toHaveBeenCalled();
    expect(result.current.quote).toBe('1000');
  });
});
