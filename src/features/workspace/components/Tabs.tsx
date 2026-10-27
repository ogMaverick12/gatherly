'use client';

import { useCallback, useRef, type KeyboardEvent } from 'react';

export interface TabDefinition<T extends string> {
  readonly id: T;
  readonly label: string;
  readonly badge?: string | number;
}

/**
 * An accessible tab strip.
 *
 * Uses the ARIA tabs pattern: arrow keys move between tabs, Home and End
 * jump to the ends, and only the selected tab is in the page tab order.
 * long-function: the ARIA key map and the elements it moves focus between stay in one block on purpose.
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

      let nextIndex: number | null = null;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = tabs.length - 1;
      }

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
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            id={`${idPrefix}-tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={`min-h-[44px] shrink-0 rounded-pill px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              selected ? 'bg-ink text-paper' : 'text-ink-muted hover:bg-raised hover:text-ink'
            }`}
          >
            {tab.label}
            {tab.badge !== undefined && tab.badge !== '' ? (
              <span className="ml-2 rounded-pill bg-marigold px-1.5 py-0.5 text-[0.65rem] font-semibold text-on-marigold">
                {tab.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
