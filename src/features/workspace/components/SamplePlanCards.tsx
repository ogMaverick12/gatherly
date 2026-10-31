'use client';

/**
 * One-click sample plans on the landing page.
 * Opening one stores a real, editable plan in this browser and opens the workspace.
 */

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useAccessibility } from '@/features/accessibility';
import { createSamplePlan, type SamplePlanTemplate } from '@/lib/plan';
import { setPlan } from '@/lib/plan-store';
import { EVENT_TYPE_LABELS } from '@/lib/plan';

/**
 * One-click sample plans.
 *
 * Opening a sample creates a real, editable plan in the browser store. It
 * is not a screenshot and it does not need a network.
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
        <Card key={template.id} as="li" padding="xl" className="flex flex-col shadow-card">
          <SectionLabel tone="teal" spacing="widest" size="sm">
            {EVENT_TYPE_LABELS[template.intake.eventType]}
          </SectionLabel>
          <h3 className="mt-2 font-display text-title-lg">{template.name}</h3>
          <p className="mt-2 text-sm font-medium text-ink">{template.tagline}</p>
          <p className="mt-2 flex-1 text-sm text-ink-muted">{template.description}</p>
          <Button
            onClick={() => openSample(template)}
            disabled={pending !== null}
            variant="secondary"
            tone="ink"
            size="none"
            className="mt-5 px-5 py-2.5 text-sm font-semibold"
          >
            {pending === template.id
              ? dictionary.common.loading
              : `${dictionary.landing.heroSecondary} - ${template.name}`}
          </Button>
        </Card>
      ))}
    </ul>
  );
}
