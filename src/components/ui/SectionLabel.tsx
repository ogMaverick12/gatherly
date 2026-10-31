import type { HTMLAttributes, ReactNode } from 'react';

type SectionLabelTone = 'muted' | 'teal' | 'rose';
type SectionLabelSpacing = 'tight' | 'wide' | 'wider' | 'widest' | 'page' | 'hero';
type SectionLabelSize = 'xs' | 'sm' | 'tiny';

/** Props accepted by the section label component. */
export interface SectionLabelProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: SectionLabelTone;
  spacing?: SectionLabelSpacing;
  size?: SectionLabelSize;
}

const BASE = 'inline-block font-semibold uppercase';

const SIZES: Record<SectionLabelSize, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  tiny: 'text-[0.65rem]',
};

const TONES: Record<SectionLabelTone, string> = {
  muted: 'text-ink-muted',
  teal: 'text-teal',
  rose: 'text-rose',
};

const SPACING: Record<SectionLabelSpacing, string> = {
  tight: 'tracking-[0.12em]',
  wide: 'tracking-[0.14em]',
  wider: 'tracking-[0.16em]',
  widest: 'tracking-[0.18em]',
  page: 'tracking-[0.2em]',
  hero: 'tracking-[0.22em]',
};

/** A small uppercase label for a section, field or eyebrow. */
export function SectionLabel({
  children,
  tone = 'muted',
  spacing = 'tight',
  size = 'xs',
  className = '',
  ...props
}: SectionLabelProps) {
  return (
    <span
      className={`${BASE} ${SIZES[size]} ${TONES[tone]} ${SPACING[spacing]} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
}
