'use client';

/**
 * The workspace tab list and its two presentations.
 * One definition drives the wide tab strip and the phone bottom bar.
 */

import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import type { Dictionary } from '@/lib/i18n';
import type { PlanView } from '../plan-view';
import { Tabs, type TabDefinition } from './Tabs';

/** The stable id of one workspace section. */
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
 */
export function WorkspaceTabs({
  tabs,
  activeTab,
  onChange,
  sectionsLabel,
}: {
  tabs: readonly TabDefinition<WorkspaceTabId>[];
  activeTab: WorkspaceTabId;
  onChange: (tab: WorkspaceTabId) => void;
  sectionsLabel: string;
}) {
  return (
    <>
      <div className="no-print hidden lg:block">
        <Tabs
          tabs={tabs}
          active={activeTab}
          onChange={onChange}
          idPrefix="workspace"
          ariaLabel={sectionsLabel}
        />
      </div>

      <nav
        aria-label={sectionsLabel}
        className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-line bg-raised/95 backdrop-blur lg:hidden"
      >
        <ul className="flex items-stretch justify-between">
          {tabs.map((tab) => {
            const selected = tab.id === activeTab;
            return (
              <li key={tab.id} className="flex-1">
                <Button
                  onClick={() => onChange(tab.id)}
                  aria-current={selected ? 'page' : undefined}
                  variant="quiet"
                  tone={selected ? 'teal' : 'default'}
                  size="none"
                  className="min-h-14 w-full flex-col gap-0.5 px-1 py-2 text-[0.65rem] font-medium"
                >
                  <span className="truncate">{tab.label}</span>
                  {tab.badge !== undefined ? (
                    <Chip tone="accent" size="xs">
                      {tab.badge}
                    </Chip>
                  ) : null}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
