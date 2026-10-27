'use client';

import { useState } from 'react';
import { useAccessibility } from '@/features/accessibility/provider';
import type { PlanView } from '@/lib/plan-view';
import type { Idea } from '@/lib/plan';
import { renderSnapshotForModel } from '@/features/assistant/services';

// long-function: one view section, kept in one block so its reading order stays visible.
export function IdeasPanel({
  view,
  onApplyIdea,
  onStoreIdeas,
}: {
  view: PlanView;
  onApplyIdea: (idea: Idea) => void;
  onStoreIdeas: (ideas: readonly Idea[]) => void;
}) {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const [ideas, setIdeas] = useState<readonly Idea[]>(view.ideas);
  const [mode, setMode] = useState<'basic' | 'provider'>('basic');
  const [notices, setNotices] = useState<readonly string[]>([]);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState<readonly string[]>([]);

  const refresh = async () => {
    setLoading(true);
    setNotices([]);
    try {
      const response = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
            month: view.plan.intake.eventDate
              ? Number(view.plan.intake.eventDate.slice(5, 7))
              : null,
          },
        }),
      });

      if (!response.ok) {
        setNotices([t.errors.generic]);
        return;
      }

      const data = (await response.json()) as {
        mode: 'basic' | 'provider';
        ideas: Idea[];
        notices: string[];
      };
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-title">{t.workspace.ideasTitle}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t.workspace.ideasHelp}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-pill bg-line/60 px-3 py-1 text-xs font-semibold text-ink">
            {mode === 'basic' ? t.workspace.basicMode : t.workspace.providerMode}
          </span>
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="inline-flex min-h-[44px] items-center justify-center rounded-pill border border-ink px-4 py-2 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-ink hover:text-paper disabled:opacity-60"
          >
            {loading ? t.common.loading : t.workspace.generateIdeas}
          </button>
        </div>
      </div>

      {mode === 'basic' ? (
        <p className="rounded-card border border-line bg-paper p-4 text-sm text-ink-muted">
          {t.workspace.basicModeHelp}
        </p>
      ) : null}

      {notices.length > 0 ? (
        <ul role="status" className="space-y-1 text-sm text-ink-muted">
          {notices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
        </ul>
      ) : null}

      <ul className="grid gap-3 md:grid-cols-2">
        {ideas.map((idea) => {
          const isApplied = applied.includes(idea.id);
          return (
            <li
              key={idea.id}
              className="flex flex-col rounded-card border border-line bg-raised p-5"
            >
              <h3 className="font-semibold text-ink">{idea.title}</h3>
              <p className="mt-2 flex-1 text-sm text-ink-muted">{idea.body}</p>
              {idea.rationale ? (
                <p className="mt-2 text-sm text-ink">
                  <span className="font-medium">Why: </span>
                  {idea.rationale}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {idea.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-pill bg-line/60 px-2 py-0.5 text-[0.65rem] font-medium text-ink-muted"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-4">
                {isApplied ? (
                  <p className="text-sm font-medium text-teal">{t.workspace.applied}</p>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyIdea(idea);
                        setApplied((current) => [...current, idea.id]);
                      }}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-pill border border-teal px-4 py-2 text-sm font-medium text-teal transition-colors duration-200 hover:bg-teal hover:text-paper"
                    >
                      {t.workspace.applyProposal}
                    </button>
                    <p className="mt-1.5 text-xs text-ink-muted">
                      This adds one task to your checklist. Nothing else in the plan changes.
                    </p>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
