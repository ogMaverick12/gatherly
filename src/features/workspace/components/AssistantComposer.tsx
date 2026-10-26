'use client';

import { useAccessibility } from '@/features/accessibility/provider';

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
        className="min-h-[44px] flex-1 rounded-pill border border-line bg-raised px-4 py-2 text-sm text-ink placeholder:text-ink-muted/70"
      />
      <button
        type="submit"
        disabled={loading || draft.trim().length === 0}
        className="inline-flex min-h-[44px] items-center justify-center rounded-pill border border-ink px-5 py-2 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-ink hover:text-paper disabled:opacity-60"
      >
        {t.workspace.send}
      </button>
      {loading ? (
        <button
          type="button"
          onClick={onStop}
          className="inline-flex min-h-[44px] items-center justify-center rounded-pill border border-line px-5 py-2 text-sm font-semibold text-ink-muted transition-colors duration-200 hover:border-ink hover:text-ink"
        >
          {t.workspace.stop}
        </button>
      ) : null}
    </form>
  );
}
