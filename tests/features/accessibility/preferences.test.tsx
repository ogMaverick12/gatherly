import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_PREFERENCES,
  readStoredPreferences,
  writeStoredPreferences,
} from '@/features/accessibility/preferences';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('preferences without a browser window', () => {
  it('reads the defaults when there is no storage to read', () => {
    vi.stubGlobal('window', undefined);

    expect(readStoredPreferences()).toEqual(DEFAULT_PREFERENCES);
  });

  it('does not try to write when there is no storage to write to', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    vi.stubGlobal('window', undefined);

    expect(() => writeStoredPreferences(DEFAULT_PREFERENCES)).not.toThrow();
    expect(setItem).not.toHaveBeenCalled();
  });
});
