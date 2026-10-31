'use client';

/**
 * One generated idea, with its rationale, tags and apply control.
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
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
    <Card as="li" padding="lg" className="flex flex-col">
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
          <Chip key={tag} size="sm">
            {tag}
          </Chip>
        ))}
      </div>
      <div className="mt-4">
        {isApplied ? (
          <p className="text-sm font-medium text-teal">{t.workspace.applied}</p>
        ) : (
          <>
            <Button onClick={() => onApply(idea)} variant="secondary" tone="teal" size="compact">
              {t.workspace.applyProposal}
            </Button>
            <p className="mt-1.5 text-xs text-ink-muted">
              This adds one task to your checklist. Nothing else in the plan changes.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
