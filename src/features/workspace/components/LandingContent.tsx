'use client';

/**
 * The landing page: hero, sample plans, feature list and the inclusion note.
 * All figures come from a sample plan computed in the browser, not from a server.
 */

import { useMemo } from 'react';
import { useAccessibility } from '@/features/accessibility/provider';
import { computeBudget } from '@/features/budget/services';
import { createSamplePlan, SAMPLE_PLAN_TEMPLATES } from '@/lib/plan';
import {
  FeaturesSection,
  InclusionSection,
  LandingHero,
  SamplePlansSection,
  type LandingPreview,
} from './landing-sections';

/** Compute the sample plan once for the hero preview. */
function useSamplePreview(): LandingPreview | null {
  return useMemo(() => {
    const template = SAMPLE_PLAN_TEMPLATES[0];
    if (!template) return null;
    const plan = createSamplePlan(template, new Date('2026-01-01T00:00:00.000Z'));
    const budget = computeBudget(plan);
    const top = budget.categories.filter((category) => category.amountMinor > 0).slice(0, 3);
    return { plan, budget, top };
  }, []);
}

/**
 * Render the marketing page with a live sample plan preview.
 * Copy comes from the dictionary, so the page follows the selected language.
 */
export function LandingContent() {
  const { dictionary } = useAccessibility();
  const t = dictionary;
  const preview = useSamplePreview();

  return (
    <>
      <LandingHero t={t} preview={preview} />
      <SamplePlansSection t={t} />
      <FeaturesSection t={t} />
      <InclusionSection t={t} />
    </>
  );
}
