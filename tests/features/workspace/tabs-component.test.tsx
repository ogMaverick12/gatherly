import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Tabs } from '@/features/workspace';

type TestTab = 'basics' | 'money' | 'missing';

const TABS: readonly { id: TestTab; label: string }[] = [
  { id: 'basics', label: 'Basics' },
  { id: 'money', label: 'Money' },
];

describe('the tab strip keyboard navigation', () => {
  it('does nothing when the active id is not one of the tabs', () => {
    const onChange = vi.fn();
    render(
      <Tabs
        tabs={TABS}
        active="missing"
        onChange={onChange}
        idPrefix="plan"
        ariaLabel="Sections"
      />,
    );

    fireEvent.keyDown(screen.getByRole('tablist', { name: 'Sections' }), { key: 'ArrowRight' });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('does nothing for a key that does not move tabs', () => {
    const onChange = vi.fn();
    render(
      <Tabs tabs={TABS} active="basics" onChange={onChange} idPrefix="plan" ariaLabel="Sections" />,
    );

    fireEvent.keyDown(screen.getByRole('tablist', { name: 'Sections' }), { key: 'Enter' });

    expect(onChange).not.toHaveBeenCalled();
  });
});
