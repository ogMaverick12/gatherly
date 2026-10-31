'use client';

/**
 * The question box for the plan assistant.
 * It renders the input, send and stop controls; the chat hook owns their state.
 */

import { Button } from '@/components/ui/Button';
import { useAccessibility } from '@/features/accessibility';

// long-function: one view section, kept in one block so its reading order stays visible.
/** The question box, its send button, and Stop while an answer is arriving. */
export function AssistantComposer({
  draft,
  loading,
  onDraftChange,
  onAsk,
  onStop,
}: {
  draft: string;
  loading: boolean;
  onDraftChange: (value: string) => void;
  onAsk: () => void;
  onStop: () => void;
}) {
  const { dictionary } = useAccessibility();
  const t = dictionary;

  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onAsk();
      }}
    >
      <label htmlFor="assistant-input" className="sr-only">
        {t.workspace.assistantTitle}
      </label>
      <input
        id="assistant-input"
        type="text"
        value={draft}
        maxLength={2000}
        onChange={(event) => onDraftChange(event.target.value)}
        placeholder={t.workspace.assistantPlaceholder}
        className="min-h-11 flex-1 rounded-pill border border-line bg-raised px-4 py-2 text-sm text-ink placeholder:text-ink-muted/70"
      />
      <Button
        type="submit"
        variant="secondary"
        tone="ink"
        size="none"
        disabled={loading || draft.trim().length === 0}
        className="px-5 py-2 text-sm font-semibold"
      >
        {t.workspace.send}
      </Button>
      {loading ? (
        <Button
          onClick={onStop}
          variant="quiet"
          size="none"
          className="border border-line px-5 py-2 text-sm font-semibold hover:border-ink"
        >
          {t.workspace.stop}
        </Button>
      ) : null}
    </form>
  );
}
