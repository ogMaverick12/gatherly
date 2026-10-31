'use client';

/**
 * The workspace shell: header, tab strip, the active panel and the health rail.
 * Tabs come from one list, so the wide and narrow layouts always match.
 */

import dynamic from 'next/dynamic';
import { useAccessibility } from '@/features/accessibility';
import { usePlanWorkspace, type PlanWorkspaceController } from '../hooks/use-plan-workspace';
import { useWideLayout } from '../hooks/use-wide-layout';
import type { PlanView } from '../plan-view';
import { HealthRail, MobileHealthSummary } from './HealthRail';
import { NoPlanScreen } from './NoPlanScreen';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceTabs, workspaceTabs, type WorkspaceTabId } from './WorkspaceTabs';

/** A neutral panel placeholder; it holds the page height while a tab loads. */
function PanelSkeleton() {
  return (
    <div role="status" aria-busy="true" className="min-h-[50svh] space-y-4">
      <span className="sr-only">Loading plan section</span>
      <div className="h-8 w-40 rounded-card bg-line/70" />
      <div className="h-4 w-2/3 rounded-card bg-line/50" />
      <div className="h-56 rounded-card border border-line bg-raised/60" />
    </div>
  );
}

/** The neutral first paint: never claim there is no plan before the store is read. */
function WorkspaceSkeleton() {
  return (
    <div aria-busy="true" className="mx-auto min-h-[100svh] max-w-7xl px-5 pb-28 pt-8 lg:pb-14">
      <span role="status" className="sr-only">
        Loading your plan
      </span>
      <div className="h-4 w-24 rounded-card bg-line/60" />
      <div className="mt-3 h-9 w-72 rounded-card bg-line/70" />
      <div className="mt-8 h-11 w-full rounded-pill bg-line/50" />
      <div className="mt-6">
        <PanelSkeleton />
      </div>
    </div>
  );
}

const PANEL_OPTIONS = { ssr: false, loading: PanelSkeleton };

const LazyOverviewPanel = dynamic(
  () => import('./OverviewPanel').then((module) => module.OverviewPanel),
  { ...PANEL_OPTIONS },
);
const LazyBudgetPanel = dynamic(
  () => import('./BudgetPanel').then((module) => module.BudgetPanel),
  { ...PANEL_OPTIONS },
);
const LazyTimelinePanel = dynamic(
  () => import('./TimelinePanel').then((module) => module.TimelinePanel),
  { ...PANEL_OPTIONS },
);
const LazyVendorsPanel = dynamic(
  () => import('./VendorsPanel').then((module) => module.VendorsPanel),
  { ...PANEL_OPTIONS },
);
const LazyIdeasPanel = dynamic(() => import('./IdeasPanel').then((module) => module.IdeasPanel), {
  ...PANEL_OPTIONS,
});
const LazyAssistantPanel = dynamic(
  () => import('./AssistantPanel').then((module) => module.AssistantPanel),
  { ...PANEL_OPTIONS },
);

/** The active tab's panel, with the edit callbacks that panel needs. */
function ActivePanel({
  view,
  activeTab,
  controller,
}: {
  readonly view: PlanView;
  readonly activeTab: WorkspaceTabId;
  readonly controller: PlanWorkspaceController;
}) {
  switch (activeTab) {
    case 'overview':
      return <LazyOverviewPanel view={view} onToggleTask={controller.onToggleTask} />;
    case 'budget':
      return <LazyBudgetPanel view={view} />;
    case 'timeline':
      return <LazyTimelinePanel view={view} onToggleMilestone={controller.onToggleMilestone} />;
    case 'vendors':
      return (
        <LazyVendorsPanel
          view={view}
          onUpdateVendor={controller.onUpdateVendor}
          onAddVendor={controller.onAddVendor}
        />
      );
    case 'ideas':
      return (
        <LazyIdeasPanel
          view={view}
          onApplyIdea={controller.onApplyIdea}
          onStoreIdeas={controller.onStoreIdeas}
        />
      );
    case 'assistant':
      return <LazyAssistantPanel view={view} onSend={controller.onSend} />;
    default:
      return null;
  }
}

/** The workspace: one header, six panel sections and the health rail beside them. */
export function PlanWorkspace() {
  const { dictionary } = useAccessibility();
  const controller = usePlanWorkspace();
  const wide = useWideLayout();
  const { plan, view, activeTab, hydrated } = controller;

  if (!hydrated) return <WorkspaceSkeleton />;
  if (!plan || !view) return <NoPlanScreen onOpen={controller.replace} />;

  const tabs = workspaceTabs(view, dictionary);

  return (
    <div className="mx-auto min-h-[100svh] max-w-7xl px-5 pb-24 pt-8 lg:pb-14">
      <WorkspaceHeader view={view} plan={plan} onClear={controller.clear} />

      <MobileHealthSummary view={view} t={dictionary} />

      <div className="mt-4 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          <WorkspaceTabs tabs={tabs} activeTab={activeTab} onChange={controller.setActiveTab} />

          <div
            id={`workspace-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`workspace-tab-${activeTab}`}
            tabIndex={0}
            className="mt-4 focus:outline-none lg:mt-6"
          >
            <ActivePanel view={view} activeTab={activeTab} controller={controller} />
          </div>
        </div>

        {wide ? (
          <aside className="no-print hidden lg:block">
            <div className="sticky top-6">
              <HealthRail view={view} />
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
