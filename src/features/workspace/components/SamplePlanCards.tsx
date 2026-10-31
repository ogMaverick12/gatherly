'use client';

/**
 * One-click sample plans on the landing page.
 * Opening one stores a real, editable plan in this browser and opens the workspace.
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAccessibility } from '@/features/accessibility';
import { createSamplePlan, type SamplePlanTemplate } from '@/lib/plan';
import { setPlan } from '@/lib/plan-store';
import { EVENT_TYPE_LABELS } from '@/lib/plan';

/**
 * One-click sample plans.
 *
 * Opening a sample creates a real, editable plan in the browser store. It
 * is not a screenshot and it does not need a network.
 * long-function: one list sharing the create-then-open handler; a card per file would only move the markup.
 */
export function SamplePlanCards({ templates }: { templates: readonly SamplePlanTemplate[] }) {
  const router = useRouter();
  const { dictionary, setLanguage } = useAccessibility();
  const [pending, setPending] = useState<string | null>(null);

  const openSample = (template: SamplePlanTemplate) => {
    setPending(template.id);
    const plan = createSamplePlan(template, new Date());
    setPlan(plan);
    setLanguage(plan.intake.language);
    router.push('/plan');
  };

  return (
    <ul className="mt-10 grid gap-5 md:grid-cols-3">
      {templates.map((template) => (
        <li
          key={template.id}
          className="flex flex-col rounded-card border border-line bg-raised p-6 shadow-card"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal">
            {EVENT_TYPE_LABELS[template.intake.eventType]}
          </p>
          <h3 className="mt-2 font-display text-title-lg">{template.name}</h3>
          <p className="mt-2 text-sm font-medium text-ink">{template.tagline}</p>
          <p className="mt-2 flex-1 text-sm text-ink-muted">{template.description}</p>
          <button
            type="button"
            onClick={() => openSample(template)}
            disabled={pending !== null}
            className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-pill border border-ink px-5 py-2.5 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-ink hover:text-paper disabled:opacity-60"
          >
            {pending === template.id
              ? dictionary.common.loading
              : `${dictionary.landing.heroSecondary} - ${template.name}`}
          </button>
        </li>
      ))}
    </ul>
  );
}
