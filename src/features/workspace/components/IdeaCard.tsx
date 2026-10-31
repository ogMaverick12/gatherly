'use client';

/**
 * One generated idea, with its rationale, tags and apply control.
 */

import type { Dictionary } from '@/lib/i18n';
import type { Idea } from '@/lib/plan';

/**
 * Render an idea and its apply state.
 * @param props the idea, applied state, dictionary and apply callback
 * @returns the idea list item
 */
export function IdeaCard({
  idea,
  isApplied,
  t,
  onApply,
}: {
  readonly idea: Idea;
  readonly isApplied: boolean;
  readonly t: Dictionary;
  readonly onApply: (idea: Idea) => void;
}) {
  return (
    <li className="flex flex-col rounded-card border border-line bg-raised p-5">
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
              onClick={() => onApply(idea)}
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
}
