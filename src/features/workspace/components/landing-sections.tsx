'use client';

/**
 * The landing page sections below the hero state.
 */

import Link from 'next/link';
import type { BudgetAllocation, CategoryAllocation } from '@/features/budget/types';
import { GarlandLine } from '@/features/workspace/components/GarlandLine';
import { HealthRing } from '@/features/workspace/components/HealthRing';
import { SamplePlanCards } from '@/features/workspace/components/SamplePlanCards';
import type { Dictionary } from '@/lib/i18n';
import { formatMoney } from '@/lib/money';
import { SAMPLE_PLAN_TEMPLATES, type Plan } from '@/lib/plan';
import type { PlanView } from '@/lib/plan-view';

const FEATURE_KEYS = ['budget', 'timeline', 'vendors', 'health', 'ideas', 'export'] as const;

/** The computed sample plan shown in the hero preview. */
export interface LandingPreview {
  readonly plan: Plan;
  readonly budget: BudgetAllocation;
  readonly top: readonly CategoryAllocation[];
  readonly health: PlanView['health'];
}

/** The hero copy and sample plan preview. */
export function LandingHero({
  t,
  preview,
}: {
  readonly t: Dictionary;
  readonly preview: LandingPreview | null;
}) {
  return (
    <section className="relative overflow-hidden">
      <GarlandLine className="pointer-events-none absolute inset-x-0 top-0 h-24 w-full text-teal" />
      <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-teal">
            {t.landing.heroEyebrow}
          </p>
          <h1 className="mt-4 font-display text-display-lg text-ink">{t.landing.heroTitle}</h1>
          <p className="mt-6 max-w-prose text-lg text-ink-muted">{t.landing.heroBody}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/intake"
              className="inline-flex min-h-[44px] items-center justify-center rounded-pill bg-ink px-7 py-3 text-sm font-semibold text-paper transition-transform duration-200 ease-spring hover:-translate-y-0.5"
            >
              {t.landing.heroPrimary}
            </Link>
            <a
              href="#samples"
              className="inline-flex min-h-[44px] items-center justify-center rounded-pill border border-line-strong px-7 py-3 text-sm font-semibold text-ink transition-colors duration-200 hover:border-ink"
            >
              {t.landing.heroSecondary}
            </a>
          </div>
        </div>

        {preview ? <SamplePreview preview={preview} /> : null}
      </div>
    </section>
  );
}

/** The live sample-plan card in the hero. */
export function SamplePreview({ preview }: { readonly preview: LandingPreview }) {
  return (
    <div className="rounded-card border border-line bg-raised p-6 shadow-card">
      <div className="flex items-center gap-5">
        <HealthRing
          score={preview.health.score}
          band={preview.health.band}
          size={96}
          label="Plan health"
        />
        <div>
          <p className="font-display text-title-lg">A sample plan</p>
          <p className="mt-1 text-sm text-ink-muted">
            {preview.plan.intake.guests} guests,{' '}
            {formatMoney(preview.budget.totalMinor, preview.plan.intake.currency)} planned
          </p>
        </div>
      </div>
      <dl className="mt-6 space-y-3">
        {preview.top.map((category) => (
          <div key={category.id} className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-ink-muted">{category.label}</dt>
            <dd className="font-display text-base">
              {category.sharePercent}%
              <span className="ms-3 text-sm text-ink-muted">
                {formatMoney(category.amountMinor, preview.plan.intake.currency)}
              </span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 border-t border-line pt-4 text-sm text-ink-muted">
        Every number above is calculated in your browser, with the arithmetic in plain sight.
      </p>
    </div>
  );
}

/** The sample-plan section. */
export function SamplePlansSection({ t }: { readonly t: Dictionary }) {
  return (
    <section id="samples" className="mx-auto max-w-6xl px-5 py-16">
      <div className="max-w-prose">
        <h2 className="font-display text-display-sm">{t.landing.sampleTitle}</h2>
        <p className="mt-3 text-ink-muted">{t.landing.sampleBody}</p>
      </div>
      <SamplePlanCards templates={SAMPLE_PLAN_TEMPLATES} />
    </section>
  );
}

/** The feature list. */
export function FeaturesSection({ t }: { readonly t: Dictionary }) {
  return (
    <section id="features" className="border-y border-line bg-raised">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <div className="max-w-prose">
          <h2 className="font-display text-display-sm">{t.landing.featureTitle}</h2>
          <p className="mt-3 text-ink-muted">{t.landing.featureBody}</p>
        </div>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURE_KEYS.map((key) => (
            <li key={key} className="rounded-card border border-line bg-paper p-6">
              <h3 className="font-display text-title">{t.landing.features[key].title}</h3>
              <p className="mt-2 text-sm text-ink-muted">{t.landing.features[key].body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** The inclusion note and template list. */
export function InclusionSection({ t }: { readonly t: Dictionary }) {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="grid gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-center">
        <div>
          <h2 className="font-display text-display-sm">{t.landing.inclusionTitle}</h2>
          <p className="mt-4 max-w-prose text-ink-muted">{t.landing.inclusionBody}</p>
          <Link
            href="/intake"
            className="mt-8 inline-flex min-h-[44px] items-center justify-center rounded-pill bg-ink px-7 py-3 text-sm font-semibold text-paper transition-transform duration-200 ease-spring hover:-translate-y-0.5"
          >
            {t.landing.startCta}
          </Link>
        </div>
        <ul className="space-y-3">
          {SAMPLE_PLAN_TEMPLATES.map((template) => (
            <li
              key={template.id}
              className="flex items-start gap-3 rounded-card border border-line bg-raised p-4"
            >
              <span
                aria-hidden="true"
                className="mt-1.5 inline-block h-2.5 w-2.5 shrink-0 rounded-full bg-marigold"
              />
              <div>
                <p className="font-semibold">{template.name}</p>
                <p className="text-sm text-ink-muted">{template.tagline}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
