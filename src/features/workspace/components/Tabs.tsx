'use client';

/**
 * A small, accessible tab strip built on the ARIA tabs pattern.
 * It is generic over the tab id and reports selection upward; it holds no plan state.
 */

import { useCallback, useRef, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';

export interface TabDefinition<T extends string> {
  readonly id: T;
  readonly label: string;
  readonly badge?: string | number;
}

const NEXT_TAB: Readonly<Record<string, (index: number, count: number) => number>> = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowDown: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  ArrowUp: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_index, count) => count - 1,
};

/** Return the tab index a navigation key selects, or null for another key. */
export function nextTabIndex(key: string, index: number, count: number): number | null {
  if (count <= 0 || index < 0 || index >= count) return null;
  if (!Object.hasOwn(NEXT_TAB, key)) return null;
  return NEXT_TAB[key]?.(index, count) ?? null;
}

/** One ARIA tab button, with its optional badge. */
function TabButton<T extends string>({
  tab,
  selected,
  idPrefix,
  onChange,
}: {
  tab: TabDefinition<T>;
  selected: boolean;
  idPrefix: string;
  onChange: (id: T) => void;
}) {
  return (
    <Button
      id={`${idPrefix}-tab-${tab.id}`}
      role="tab"
      aria-selected={selected}
      aria-controls={`${idPrefix}-panel-${tab.id}`}
      tabIndex={selected ? 0 : -1}
      onClick={() => onChange(tab.id)}
      variant={selected ? 'primary' : 'quiet'}
      size="compact"
      className={selected ? 'shrink-0' : 'shrink-0 hover:bg-raised'}
    >
      {tab.label}
      {tab.badge !== undefined && tab.badge !== '' ? (
        <Chip tone="accent" size="sm" className="ml-2">
          {tab.badge}
        </Chip>
      ) : null}
    </Button>
  );
}

/**
 * An accessible tab strip.
 *
 * Uses the ARIA tabs pattern: arrow keys move between tabs, Home and End
 * jump to the ends, and only the selected tab is in the page tab order.
 */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
  idPrefix,
  className = '',
}: {
  tabs: readonly TabDefinition<T>[];
  active: T;
  onChange: (id: T) => void;
  idPrefix: string;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const index = tabs.findIndex((tab) => tab.id === active);
      if (index < 0) return;

      const nextIndex = nextTabIndex(event.key, index, tabs.length);
      if (nextIndex === null) return;
      event.preventDefault();
      const next = tabs[nextIndex];
      if (!next) return;
      onChange(next.id);
      const button = listRef.current?.querySelector<HTMLButtonElement>(
        `#${CSS.escape(`${idPrefix}-tab-${next.id}`)}`,
      );
      button?.focus();
    },
    [active, idPrefix, onChange, tabs],
  );

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Plan sections"
      // The tabs themselves are the focus stops; the strip is only
      // programmatically focusable so the arrow-key handler can find it.
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className={`flex gap-1 overflow-x-auto pb-1 ${className}`}
    >
      {tabs.map((tab) => (
        <TabButton
          key={tab.id}
          tab={tab}
          selected={tab.id === active}
          idPrefix={idPrefix}
          onChange={onChange}
        />
      ))}
    </div>
  );
}
