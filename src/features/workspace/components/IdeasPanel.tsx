'use client';

/**
 * The ideas tab: generated suggestions the user can apply one at a time.
 * Requests go to the ideas route, and the badge always names the answer's mode.
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { useAccessibility } from '@/features/accessibility';
import type { PlanView } from '../plan-view';
import type { Idea } from '@/lib/plan';
import { useIdeas } from '../hooks/use-ideas';
import { IdeaCard } from './IdeaCard';

/**
 * Show plan ideas with their rationale and tags, and apply one as a task.
 * Generating replaces the list; applying only adds a task and leaves the rest alone.
 */
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
  const { ideas, mode, notices, loading, applied, refresh, apply } = useIdeas(
    view,
    onApplyIdea,
    onStoreIdeas,
    t,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-title">{t.workspace.ideasTitle}</h2>
          <p className="mt-1 text-sm text-ink-muted">{t.workspace.ideasHelp}</p>
        </div>
        <div className="flex items-center gap-3">
          <Chip tone="strong">
            {mode === 'basic' ? t.workspace.basicMode : t.workspace.providerMode}
          </Chip>
          <Button
            onClick={() => void refresh()}
            disabled={loading}
            variant="secondary"
            tone="ink"
            size="compact"
          >
            {loading ? t.common.loading : t.workspace.generateIdeas}
          </Button>
        </div>
      </div>

      {mode === 'basic' ? (
        <Card as="p" tone="paper" padding="md" className="text-sm text-ink-muted">
          {t.workspace.basicModeHelp}
        </Card>
      ) : null}

      {notices.length > 0 ? (
        <ul role="status" className="space-y-1 text-sm text-ink-muted">
          {notices.map((notice) => (
            <li key={notice}>{notice}</li>
          ))}
        </ul>
      ) : null}

      <ul className="grid gap-3 md:grid-cols-2">
        {ideas.map((idea) => (
          <IdeaCard
            key={idea.id}
            idea={idea}
            isApplied={applied.includes(idea.id)}
            t={t}
            onApply={apply}
          />
        ))}
      </ul>
    </div>
  );
}
