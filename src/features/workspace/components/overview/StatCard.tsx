'use client';

import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';

/**
 * One headline figure, with the line of context that explains it.
 * The card is presentational: the panel above computes the value and the hint.
 */
export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-3 sm:p-5">
      <SectionLabel spacing="wide">{label}</SectionLabel>
      <p className="mt-1 font-display text-title sm:mt-2 sm:text-title-lg">{value}</p>
      {hint ? (
        <p className="sr-only text-sm text-ink-muted sm:not-sr-only sm:mt-1">{hint}</p>
      ) : null}
    </Card>
  );
}
