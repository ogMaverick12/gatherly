'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAccessibility } from '@/features/accessibility/provider';
import { usePlan, usePlanActions, hydratePlan } from '@/lib/plan-store';
import { computePlanView, type PlanView } from '@/lib/plan-view';
import type { ChatMessage, Idea, Milestone, TaskArea, Vendor, VendorCategoryId } from '@/lib/plan';
import { formatMinor } from '@/lib/money';
import { formatDateOnly } from '@/lib/dates';
import { Tabs, type TabDefinition } from './Tabs';
import { HealthRail } from './HealthRail';
import { ExportBar, SharedPlanPrompt } from './ExportBar';
import { OverviewPanel } from './OverviewPanel';
import { BudgetPanel } from './BudgetPanel';
import { TimelinePanel } from './TimelinePanel';
import { VendorsPanel } from './VendorsPanel';
import { IdeasPanel } from './IdeasPanel';
import { AssistantPanel } from './AssistantPanel';
import { OfflineBanner } from '@/features/accessibility/components/OfflineBanner';

type TabId = 'overview' | 'budget' | 'timeline' | 'vendors' | 'ideas' | 'assistant';

function toStoredMilestones(milestones: PlanView['milestones']): Milestone[] {
  return milestones.map((milestone) => ({
    id: milestone.id,
    title: milestone.title,
    date: milestone.date,
    offsetDays: milestone.offsetDays,
    done: milestone.done,
    owner: milestone.owner,
    whyItMatters: milestone.whyItMatters,
  }));
}

function taskId(title: string): string {
  return `task_${Date.now().toString(36)}_${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)}`;
}

export function PlanWorkspace() {
  const { dictionary, preferences } = useAccessibility();
  const t = dictionary;
  const plan = usePlan();
  const { update, replace, clear } = usePlanActions();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const seeded = useRef<string | null>(null);

  useEffect(() => {
    hydratePlan();
  }, []);

  const view = useMemo<PlanView | null>(() => (plan ? computePlanView(plan) : null), [plan]);

  // Seed the plan with the generated milestone ladder the first time the
  // plan is opened, so exports and shares carry the dates with them.
  useEffect(() => {
    if (!plan || !view) return;
    if (seeded.current === plan.id) return;
    seeded.current = plan.id;
    if (plan.milestones.length === 0 && view.milestones.length > 0) {
      update((current) => ({ ...current, milestones: toStoredMilestones(view.milestones) }));
    }
  }, [plan, view, update]);

  if (!plan || !view) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <h1 className="font-display text-title-lg">{t.workspace.noPlan}</h1>
        <p className="mt-2 text-ink-muted">{t.workspace.noPlanCta}</p>
        <div className="mt-6 flex justify-center">
          <a
            href="/intake"
            className="inline-flex min-h-[44px] items-center justify-center rounded-pill border border-ink px-6 py-2.5 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-ink hover:text-paper"
          >
            {t.workspace.noPlanCta}
          </a>
        </div>
        <div className="mt-8 flex justify-center">
          <SharedPlanPrompt onOpen={(shared) => replace(shared)} />
        </div>
      </div>
    );
  }

  const tabs: TabDefinition<TabId>[] = [
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

  const onToggleTask = (id: string) => {
    update((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)),
    }));
  };

  const onToggleMilestone = (id: string) => {
    update((current) => {
      const merged = computePlanView(current).milestones.map((milestone) => ({
        id: milestone.id,
        title: milestone.title,
        date: milestone.date,
        offsetDays: milestone.offsetDays,
        done: milestone.id === id ? !milestone.done : milestone.done,
        owner: milestone.owner,
        whyItMatters: milestone.whyItMatters,
      }));
      return { ...current, milestones: merged };
    });
  };

  const onUpdateVendor = (id: string, patch: Partial<Vendor>) => {
    update((current) => ({
      ...current,
      vendors: current.vendors.map((vendor) =>
        vendor.id === id ? { ...vendor, ...patch } : vendor,
      ),
    }));
  };

  const onAddVendor = (category: VendorCategoryId, name: string) => {
    update((current) => ({
      ...current,
      vendors: [
        ...current.vendors,
        {
          id: `vendor_${Date.now().toString(36)}_${category}`,
          category,
          name,
          status: 'to_contact',
          quotedMinor: null,
          depositMinor: null,
          dueDate: null,
          phone: '',
          notes: '',
        },
      ],
    }));
  };

  const onApplyIdea = (idea: Idea) => {
    update((current) => {
      const area: TaskArea = idea.tags.includes('accessibility')
        ? 'accessibility'
        : idea.tags.includes('catering')
          ? 'catering'
          : idea.tags.includes('budget')
            ? 'budget'
            : idea.tags.includes('logistics')
              ? 'logistics'
              : 'general';
      const already = current.tasks.some((task) => task.title === idea.title);
      return {
        ...current,
        ideas: current.ideas.some((stored) => stored.id === idea.id)
          ? current.ideas
          : [...current.ideas, idea],
        tasks: already
          ? current.tasks
          : [
              ...current.tasks,
              {
                id: taskId(idea.title),
                title: idea.title,
                done: false,
                area,
              },
            ],
      };
    });
  };

  const onStoreIdeas = (ideas: readonly Idea[]) => {
    update((current) => ({ ...current, ideas: [...ideas] }));
  };

  const onSend = (message: ChatMessage) => {
    update((current) => ({
      ...current,
      chat: [...current.chat, message].slice(-200),
    }));
  };

  const panel = (() => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPanel view={view} onToggleTask={onToggleTask} />;
      case 'budget':
        return <BudgetPanel view={view} />;
      case 'timeline':
        return <TimelinePanel view={view} onToggleMilestone={onToggleMilestone} />;
      case 'vendors':
        return (
          <VendorsPanel view={view} onUpdateVendor={onUpdateVendor} onAddVendor={onAddVendor} />
        );
      case 'ideas':
        return <IdeasPanel view={view} onApplyIdea={onApplyIdea} onStoreIdeas={onStoreIdeas} />;
      case 'assistant':
        return <AssistantPanel view={view} onSend={onSend} />;
      default:
        return null;
    }
  })();

  return (
    <div className="mx-auto max-w-7xl px-5 pb-28 pt-8 lg:pb-14">
      <header className="no-print">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal">
              {t.workspace.planTitle}
            </p>
            <h1 className="mt-1 font-display text-title-lg">
              {view.plan.intake.guests} {t.workspace.guests.toLowerCase()}
              {view.plan.intake.eventDate
                ? ` - ${formatDateOnly(view.plan.intake.eventDate, preferences.language)}`
                : ''}
            </h1>
            <ul className="mt-3 flex flex-wrap gap-2 text-xs text-ink-muted">
              <li className="rounded-pill border border-line px-3 py-1">
                {t.workspace.budget}: {formatMinor(view.budget.totalMinor, plan.intake.currency)}
              </li>
              <li className="rounded-pill border border-line px-3 py-1">
                {t.workspace.perGuest}:{' '}
                {formatMinor(
                  plan.intake.guests > 0
                    ? Math.round(view.budget.totalMinor / plan.intake.guests)
                    : 0,
                  plan.intake.currency,
                )}
              </li>
              <li className="rounded-pill border border-line px-3 py-1">
                {t.workspace.coverage}: {view.coverage.overallPercent}%
              </li>
              {view.timeline.daysToEvent !== null ? (
                <li className="rounded-pill border border-line px-3 py-1">
                  {view.timeline.daysToEvent} {t.common.days}
                </li>
              ) : null}
            </ul>
          </div>
          <div className="flex flex-col items-start gap-3">
            <ExportBar view={view} />
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t.workspace.clearConfirm)) clear();
              }}
              className="text-sm text-ink-muted underline-offset-4 hover:text-rose hover:underline"
            >
              {t.workspace.clearPlan}
            </button>
          </div>
        </div>
        <OfflineBanner />
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div>
          <div className="no-print hidden lg:block">
            <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} idPrefix="workspace" />
          </div>

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
                  onClick={() => setActiveTab(tab.id)}
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
    </div>
  );
}
