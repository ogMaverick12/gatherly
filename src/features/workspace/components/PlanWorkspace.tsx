'use client';

/**
 * The workspace shell: header, tab strip, the active panel and the health rail.
 * Tabs come from one list, so the wide and narrow layouts always match.
 */

import dynamic from 'next/dynamic';
import { useAccessibility } from '@/features/accessibility/provider';
import { usePlanWorkspace } from '../hooks/use-plan-workspace';
import { useWideLayout } from '../hooks/use-wide-layout';
import { HealthRail } from './HealthRail';
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

const LazyOverviewPanel = dynamic(
  () => import('./OverviewPanel').then((module) => module.OverviewPanel),
  { ssr: false, loading: PanelSkeleton },
);
const LazyBudgetPanel = dynamic(
  () => import('./BudgetPanel').then((module) => module.BudgetPanel),
  { ssr: false, loading: PanelSkeleton },
);
const LazyTimelinePanel = dynamic(
  () => import('./TimelinePanel').then((module) => module.TimelinePanel),
  { ssr: false, loading: PanelSkeleton },
);
const LazyVendorsPanel = dynamic(
  () => import('./VendorsPanel').then((module) => module.VendorsPanel),
  { ssr: false, loading: PanelSkeleton },
);
const LazyIdeasPanel = dynamic(() => import('./IdeasPanel').then((module) => module.IdeasPanel), {
  ssr: false,
  loading: PanelSkeleton,
});
const LazyAssistantPanel = dynamic(
  () => import('./AssistantPanel').then((module) => module.AssistantPanel),
  { ssr: false, loading: PanelSkeleton },
);

// long-function: one view section, kept in one block so its reading order stays visible.
/** The workspace: one header, six panel sections and the health rail beside them. */
export function PlanWorkspace() {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const controller = usePlanWorkspace();
  const wide = useWideLayout();
  const { plan, view, activeTab, hydrated } = controller;

  if (!hydrated) return <WorkspaceSkeleton />;
  if (!plan || !view) return <NoPlanScreen onOpen={controller.replace} />;

  const tabs = workspaceTabs(view, t);

  const panel = (() => {
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
  })();

  return (
    <div className="mx-auto min-h-[100svh] max-w-7xl px-5 pb-28 pt-8 lg:pb-14">
      <WorkspaceHeader view={view} plan={plan} onClear={controller.clear} />

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div>
          <WorkspaceTabs
            tabs={tabs}
            activeTab={activeTab as WorkspaceTabId}
            onChange={controller.setActiveTab}
          />

          <div
            id={`workspace-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`workspace-tab-${activeTab}`}
            tabIndex={0}
            className="mt-6 focus:outline-none"
          >
            {panel}
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
