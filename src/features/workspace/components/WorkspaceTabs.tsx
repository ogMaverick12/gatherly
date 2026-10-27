'use client';

import type { Dictionary } from '@/lib/i18n';
import type { PlanView } from '@/lib/plan-view';
import { Tabs, type TabDefinition } from './Tabs';

export type WorkspaceTabId = 'overview' | 'budget' | 'timeline' | 'vendors' | 'ideas' | 'assistant';

/** The six sections, with a badge when a section is waiting for attention. */
export function workspaceTabs(view: PlanView, t: Dictionary): TabDefinition<WorkspaceTabId>[] {
  return [
    { id: 'overview', label: t.workspace.overview },
    { id: 'budget', label: t.workspace.budget },
    {
      id: 'timeline',
      label: t.workspace.timeline,
      badge: view.timeline.overdue > 0 ? view.timeline.overdue : undefined,
    },
    {
      id: 'vendors',
      label: t.workspace.vendors,
      badge: view.coverage.outstandingCount > 0 ? view.coverage.outstandingCount : undefined,
    },
    { id: 'ideas', label: t.workspace.ideas },
    { id: 'assistant', label: t.workspace.assistant },
  ];
}

/**
 * The tabs on a wide screen, and the same tabs as a bottom bar on a phone.
 *
 * One list drives both, so a section can never be reachable in one layout and
 * missing in the other.
 * long-function: one list drives both layouts, so a section can never be reachable in one and missing in the other.
 */
export function WorkspaceTabs({
  tabs,
  activeTab,
  onChange,
}: {
  tabs: readonly TabDefinition<WorkspaceTabId>[];
  activeTab: WorkspaceTabId;
  onChange: (tab: WorkspaceTabId) => void;
}) {
  return (
    <>
      <div className="no-print hidden lg:block">
        <Tabs tabs={[...tabs]} active={activeTab} onChange={onChange} idPrefix="workspace" />
      </div>

      <nav
        aria-label="Plan sections"
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-raised/95 backdrop-blur lg:hidden"
      >
        <ul className="flex items-stretch justify-between">
          {tabs.map((tab) => {
            const selected = tab.id === activeTab;
            return (
              <li key={tab.id} className="flex-1">
                <button
                  type="button"
                  onClick={() => onChange(tab.id)}
                  aria-current={selected ? 'page' : undefined}
                  className={`flex min-h-[3.5rem] w-full flex-col items-center justify-center gap-0.5 px-1 py-2 text-[0.65rem] font-medium ${
                    selected ? 'text-teal' : 'text-ink-muted'
                  }`}
                >
                  <span className="truncate">{tab.label}</span>
                  {tab.badge !== undefined ? (
                    <span className="rounded-pill bg-marigold px-1.5 text-[0.6rem] font-semibold text-on-marigold">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
