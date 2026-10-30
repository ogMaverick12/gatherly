'use client';

/**
 * One headline figure, with the line of context that explains it.
 * The card is presentational: the panel above computes the value and the hint.
 */
export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-card border border-line bg-raised p-3 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-title sm:mt-2 sm:text-title-lg">{value}</p>
      {hint ? (
        <p className="sr-only text-sm text-ink-muted sm:not-sr-only sm:mt-1">{hint}</p>
      ) : null}
    </div>
  );
}
