'use client';

import { useAccessibility } from '@/features/accessibility/provider';
import type { Plan } from '@/lib/plan';
import { SharedPlanPrompt } from './ExportBar';

/** What the workspace shows when there is no plan in this browser yet. */
export function NoPlanScreen({ onOpen }: { onOpen: (plan: Plan) => void }) {
  const { dictionary } = useAccessibility();
  const t = dictionary;

  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center">
      <h1 className="font-display text-title-lg">{t.workspace.noPlan}</h1>
      <p className="mt-2 text-ink-muted">{t.workspace.noPlanCta}</p>
      <div className="mt-6 flex justify-center">
        <a
          href="/intake"
          className="inline-flex min-h-[44px] items-center justify-center rounded-pill border border-ink px-6 py-2.5 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-ink hover:text-paper"
        >
          {t.workspace.noPlanCta}
        </a>
      </div>
      <div className="mt-8 flex justify-center">
        <SharedPlanPrompt onOpen={onOpen} />
      </div>
    </div>
  );
}
