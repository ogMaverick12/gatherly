'use client';

import type { ReactNode } from 'react';

/** The input styling every vendor field shares. */
export const FIELD_CLASS =
  'mt-1 w-full min-h-[44px] rounded-card border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-muted/70';

/**
 * A labelled field.
 *
 * The label is bound to the control by `htmlFor`, so a screen reader announces
 * the name when the input takes focus - the label above it is not decoration.
 */
export function VendorField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
