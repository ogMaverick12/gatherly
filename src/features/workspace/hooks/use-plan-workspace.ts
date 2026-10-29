'use client';

/**
 * The workspace controller: reads the stored plan and exposes every edit.
 * Edits go through the pure helpers in plan-updates so the panels stay presentational.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { computePlanView, type PlanView } from '@/lib/plan-view';
import { hydratePlan, usePlan, usePlanActions } from '@/lib/plan-store';
import type { ChatMessage, Idea, Plan, Vendor, VendorCategoryId } from '@/lib/plan';
import {
  toStoredMilestones,
  withChatMessage,
  withIdeaApplied,
  withIdeasStored,
  withMilestoneToggled,
  withTaskToggled,
  withVendorAdded,
  withVendorUpdated,
} from '../plan-updates';

export interface PlanWorkspaceController {
  readonly plan: Plan | null;
  readonly view: PlanView | null;
  readonly activeTab: string;
  setActiveTab(tab: string): void;
  onToggleTask(id: string): void;
  onToggleMilestone(id: string): void;
  onUpdateVendor(id: string, patch: Partial<Vendor>): void;
  onAddVendor(category: VendorCategoryId, name: string): void;
  onApplyIdea(idea: Idea): void;
  onStoreIdeas(ideas: readonly Idea[]): void;
  onSend(message: ChatMessage): void;
  clear(): void;
  replace(plan: Plan): void;
}

/**
 * The workspace's state and its edits.
 *
 * The Panel components do not know how a plan is stored: every change here is
 * handed to a pure helper in `plan-updates.ts`, so the rules stay in one place
 * and the panels stay presentational.
 */
export function usePlanWorkspace(): PlanWorkspaceController {
  const plan = usePlan();
  const { update, replace, clear } = usePlanActions();
  const [activeTab, setActiveTab] = useState('overview');
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

  return {
    plan,
    view,
    activeTab,
    setActiveTab,
    onToggleTask: (id) => update((current) => withTaskToggled(current, id)),
    onToggleMilestone: (id) => update((current) => withMilestoneToggled(current, id)),
    onUpdateVendor: (id, patch) => update((current) => withVendorUpdated(current, id, patch)),
    onAddVendor: (category, name) => update((current) => withVendorAdded(current, category, name)),
    onApplyIdea: (idea) => update((current) => withIdeaApplied(current, idea)),
    onStoreIdeas: (ideas) => update((current) => withIdeasStored(current, ideas)),
    onSend: (message) => update((current) => withChatMessage(current, message)),
    clear,
    replace,
  };
}
