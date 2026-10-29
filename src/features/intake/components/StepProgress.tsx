'use client';

/**
 * The ordered progress list for the four intake steps.
 * The current step is marked with aria-current, not only with colour.
 */

import { useAccessibility } from '@/features/accessibility/provider';
import { INTAKE_STEPS, type IntakeStep } from '../schema';

/** Where the user is in the form, as an ordered list that reads as steps. */
export function StepProgress({ stepIndex }: { stepIndex: number }) {
  const { dictionary: t } = useAccessibility();
  const labels: Record<IntakeStep, string> = {
    basics: t.intake.basics,
    money: t.intake.money,
    needs: t.intake.needs,
    extras: t.intake.extras,
  };

  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm" aria-label={t.intake.step}>
      {INTAKE_STEPS.map((name, index) => {
        const current = index === stepIndex;
        const done = index < stepIndex;
        return (
          <li key={name} className="flex items-center gap-2">
            <span
              aria-current={current ? 'step' : undefined}
              className={`inline-flex min-h-[32px] items-center gap-2 rounded-pill px-3 ${
                current ? 'bg-ink text-paper' : done ? 'bg-teal/15 text-teal' : 'text-ink-muted'
              }`}
            >
              <span className="tabular-nums">{index + 1}</span>
              {labels[name]}
              {done ? <span className="sr-only">(done)</span> : null}
            </span>
            {index < INTAKE_STEPS.length - 1 ? (
              <span aria-hidden="true" className="text-line-strong">
                /
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
