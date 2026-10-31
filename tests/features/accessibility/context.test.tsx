import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAccessibility } from '@/features/accessibility';

describe('the accessibility context', () => {
  it('tells a caller outside the provider why the context is missing', () => {
    expect(() => renderHook(() => useAccessibility())).toThrow(
      'useAccessibility must be used inside an AccessibilityProvider',
    );
  });
});
