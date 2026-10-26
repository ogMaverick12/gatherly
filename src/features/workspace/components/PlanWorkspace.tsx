'use client';

import { useAccessibility } from '@/features/accessibility/provider';
import { usePlanWorkspace } from '../hooks/use-plan-workspace';
import { AssistantPanel } from './AssistantPanel';
import { BudgetPanel } from './BudgetPanel';
import { HealthRail } from './HealthRail';
import { IdeasPanel } from './IdeasPanel';
import { NoPlanScreen } from './NoPlanScreen';
import { OverviewPanel } from './OverviewPanel';
import { TimelinePanel } from './TimelinePanel';
import { VendorsPanel } from './VendorsPanel';
import { WorkspaceHeader } from './WorkspaceHeader';
import { WorkspaceTabs, workspaceTabs, type WorkspaceTabId } from './WorkspaceTabs';

/** The workspace: one header, six panel sections and the health rail beside them. */
export function PlanWorkspace() {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const controller = usePlanWorkspace();
  const { plan, view, activeTab } = controller;

  if (!plan || !view) {
    return <NoPlanScreen onOpen={controller.replace} />;
  }

  const tabs = workspaceTabs(view, t);

  const panel = (() => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPanel view={view} onToggleTask={controller.onToggleTask} />;
      case 'budget':
        return <BudgetPanel view={view} />;
      case 'timeline':
        return <TimelinePanel view={view} onToggleMilestone={controller.onToggleMilestone} />;
      case 'vendors':
        return (
          <VendorsPanel
            view={view}
            onUpdateVendor={controller.onUpdateVendor}
            onAddVendor={controller.onAddVendor}
          />
        );
      case 'ideas':
        return (
          <IdeasPanel
            view={view}
            onApplyIdea={controller.onApplyIdea}
            onStoreIdeas={controller.onStoreIdeas}
          />
        );
      case 'assistant':
        return <AssistantPanel view={view} onSend={controller.onSend} />;
      default:
        return null;
    }
  })();

  return (
    <div className="mx-auto max-w-7xl px-5 pb-28 pt-8 lg:pb-14">
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

        <aside className="no-print hidden lg:block">
          <div className="sticky top-6">
            <HealthRail view={view} />
          </div>
        </aside>
      </div>
    </div>
  );
}
