'use client';

/**
 * The empty state shown when this browser has no plan.
 * It offers the intake wizard and the prompt for a plan shared through a link.
 */

import { ButtonLink } from '@/components/ui/ButtonLink';
import { useAccessibility } from '@/features/accessibility';
import type { Plan } from '@/lib/plan';
import { SharedPlanPrompt } from './ExportBar';

/** What the workspace shows when there is no plan in this browser yet. */
export function NoPlanScreen({ onOpen }: { onOpen: (plan: Plan) => void }) {
  const { dictionary } = useAccessibility();
  const t = dictionary;

  return (
    <div className="mx-auto min-h-[100svh] max-w-2xl px-5 py-20 text-center">
      <h1 className="font-display text-title-lg">{t.workspace.noPlan}</h1>
      <p className="mt-2 text-ink-muted">{t.workspace.noPlanCta}</p>
      <div className="mt-6 flex justify-center">
        <ButtonLink href="/intake" variant="secondary" tone="ink">
          {t.workspace.noPlanCta}
        </ButtonLink>
      </div>
      <div className="mt-8 flex justify-center">
        <SharedPlanPrompt onOpen={onOpen} />
      </div>
    </div>
  );
}
