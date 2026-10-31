'use client';

/**
 * State and requests for the ideas panel.
 */

import { useState } from 'react';
import { renderSnapshotForModel } from '@/features/assistant';
import type { Dictionary } from '@/lib/i18n';
import type { Idea } from '@/lib/plan';
import type { PlanView } from '../plan-view';

interface IdeasResponse {
  readonly mode: 'basic' | 'provider';
  readonly ideas: Idea[];
  readonly notices: string[];
}

/** Build the request body the ideas route expects. */
function buildIdeasPayload(view: PlanView) {
  return {
    planSummary: renderSnapshotForModel(view.snapshot),
    context: {
      guests: view.plan.intake.guests,
      eventType: view.plan.intake.eventType,
      cityTier: view.plan.intake.cityTier,
      currency: view.plan.intake.currency,
      budgetMinor: view.plan.intake.budgetMinor,
      perGuestMinor:
        view.plan.intake.guests > 0
          ? Math.round(view.plan.intake.budgetMinor / view.plan.intake.guests)
          : 0,
      priorities: view.plan.intake.priorities,
      dietary: view.plan.intake.dietary,
      month: view.plan.intake.eventDate ? Number(view.plan.intake.eventDate.slice(5, 7)) : null,
    },
  };
}

/** Request fresh ideas, returning null when the route refuses the request. */
async function requestIdeas(view: PlanView): Promise<IdeasResponse | null> {
  const response = await fetch('/api/ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildIdeasPayload(view)),
  });
  if (!response.ok) return null;
  return (await response.json()) as IdeasResponse;
}

/** Manage the current ideas, their mode, notices and applied ids. */
export function useIdeas(
  view: PlanView,
  onApplyIdea: (idea: Idea) => void,
  onStoreIdeas: (ideas: readonly Idea[]) => void,
  t: Dictionary,
) {
  const [ideas, setIdeas] = useState<readonly Idea[]>(view.ideas);
  const [mode, setMode] = useState<'basic' | 'provider'>('basic');
  const [notices, setNotices] = useState<readonly string[]>([]);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<readonly string[]>([]);

  const refresh = async () => {
    setLoading(true);
    setNotices([]);
    try {
      const data = await requestIdeas(view);
      if (!data) {
        setNotices([t.errors.generic]);
        return;
      }
      setMode(data.mode);
      setIdeas(data.ideas);
      setNotices(data.notices ?? []);
      onStoreIdeas(data.ideas);
    } catch {
      setNotices([t.errors.offline]);
    } finally {
      setLoading(false);
    }
  };

  const apply = (idea: Idea) => {
    onApplyIdea(idea);
    setApplied((current) => [...current, idea.id]);
  };

  return { ideas, mode, notices, loading, applied, refresh, apply };
}
