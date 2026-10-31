'use client';

/**
 * The heading above the intake wizard.
 * The title and subtitle come from the active dictionary.
 */

import { useAccessibility } from '@/features/accessibility';

/** Render the intake page title and subtitle. */
export function IntakeHeading() {
  const { dictionary } = useAccessibility();
  return (
    <header className="mb-10 max-w-prose">
      <h1 className="font-display text-display">{dictionary.intake.title}</h1>
      <p className="mt-3 text-lg text-ink-muted">{dictionary.intake.subtitle}</p>
    </header>
  );
}
