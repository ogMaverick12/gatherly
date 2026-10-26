'use client';

/** One headline figure, with the line of context that explains it. */
export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-card border border-line bg-raised p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{label}</p>
      <p className="mt-2 font-display text-title-lg">{value}</p>
      {hint ? <p className="mt-1 text-sm text-ink-muted">{hint}</p> : null}
    </div>
  );
}
