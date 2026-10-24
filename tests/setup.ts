import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

// jsdom does not implement matchMedia; the accessibility layer queries it.
if (typeof window !== 'undefined' && !window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

// jsdom's scrollTo exists but only logs "not implemented"; the intake wizard
// scrolls between steps, so replace it with a no-op.
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'scrollTo', { writable: true, value: () => undefined });
}

// jsdom has no object URL support; the export buttons build a blob URL.
if (typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'function') {
  Object.defineProperty(URL, 'createObjectURL', {
    writable: true,
    value: () => 'blob:gatherly-test',
  });
  Object.defineProperty(URL, 'revokeObjectURL', { writable: true, value: () => undefined });
}
