'use client';

/**
 * The workspace controller: reads the stored plan and exposes every edit.
 * Edits go through the pure helpers in plan-updates so the panels stay presentational.
 */

import { startTransition, useEffect, useMemo, useState } from 'react';
import { todayDateOnly } from '@/lib/dates';
import { computePlanView, type PlanView } from '@/lib/plan-view';
import { hydratePlan, usePlan, usePlanActions } from '@/lib/plan-store';
import type { ChatMessage, Idea, Plan, Vendor, VendorCategoryId } from '@/lib/plan';
import { buildMilestoneLadder } from '@/features/timeline/services';
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
  readonly hydrated: boolean;
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

/** Add the generated milestone ladder to a stored plan that has none. */
function preparePlan(plan: Plan): Plan {
  if (plan.milestones.length > 0) return plan;
  const milestones = buildMilestoneLadder(plan, todayDateOnly(new Date()));
  if (milestones.length === 0) return plan;
  return { ...plan, milestones: toStoredMilestones(milestones) };
}

/**
 * The workspace's state and its edits.
 *
 * The Panel components do not know how a plan is stored: every change here is
 * handed to a pure helper in `plan-updates.ts`, so the rules stay in one place
 * and the panels stay presentational.
 *
 * The stored plan is hydrated after the neutral skeleton paints. Its generated
 * milestones are added during hydration, before the first plan render, so
 * opening a plan does not schedule a second full render.
 */
// long-function: one controller, kept together so every plan edit follows the same path.
export function usePlanWorkspace(): PlanWorkspaceController {
  const plan = usePlan();
  const { update, replace, clear } = usePlanActions();
  const [activeTab, setActiveTab] = useState('overview');
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const stored = hydratePlan(preparePlan);
    if (stored) {
      // The plan render is the heavy one; let the neutral skeleton commit
      // first and keep the plan update interruptible.
      startTransition(() => setHydrated(true));
    } else {
      setHydrated(true);
    }
  }, []);

  const view = useMemo<PlanView | null>(() => (plan ? computePlanView(plan) : null), [plan]);

  return {
    plan,
    view,
    activeTab,
    hydrated,
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
