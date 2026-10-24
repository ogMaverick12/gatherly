'use client';

import { useAccessibility } from '@/features/accessibility/provider';

export function IntakeHeading() {
  const { dictionary } = useAccessibility();
  return (
    <header className="mb-10 max-w-prose">
      <h1 className="font-display text-display">{dictionary.intake.title}</h1>
      <p className="mt-3 text-lg text-ink-muted">{dictionary.intake.subtitle}</p>
    </header>
  );
}
