import { describe, expect, it } from 'vitest';
import { nextTabIndex } from '@/features/workspace/components/Tabs';

describe('nextTabIndex', () => {
  it('moves forward and wraps at the end', () => {
    expect(nextTabIndex('ArrowRight', 2, 3)).toBe(0);
    expect(nextTabIndex('ArrowDown', 0, 3)).toBe(1);
  });

  it('moves backward and wraps at the start', () => {
    expect(nextTabIndex('ArrowLeft', 0, 3)).toBe(2);
    expect(nextTabIndex('ArrowUp', 1, 3)).toBe(0);
  });

  it('jumps to the first or last tab', () => {
    expect(nextTabIndex('Home', 1, 3)).toBe(0);
    expect(nextTabIndex('End', 1, 3)).toBe(2);
  });

  it('returns null for other keys, empty lists and invalid positions', () => {
    expect(nextTabIndex('Enter', 1, 3)).toBeNull();
    expect(nextTabIndex('toString', 1, 3)).toBeNull();
    expect(nextTabIndex('ArrowRight', 0, 0)).toBeNull();
    expect(nextTabIndex('ArrowRight', -1, 3)).toBeNull();
    expect(nextTabIndex('ArrowRight', 3, 3)).toBeNull();
  });
});
