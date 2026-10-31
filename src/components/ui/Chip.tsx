import type { HTMLAttributes, ReactNode } from 'react';

export type ChipTone =
  'muted' | 'strong' | 'accent' | 'warning' | 'outline' | 'teal' | 'tealSoft' | 'danger';
export type ChipSize = 'xs' | 'sm' | 'md' | 'inline';

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: ChipTone;
  size?: ChipSize;
}

const BASE = 'inline-flex items-center rounded-pill font-semibold';

const SIZES: Record<ChipSize, string> = {
  xs: 'px-1.5 py-0.5 text-[0.6rem]',
  sm: 'px-2 py-0.5 text-[0.65rem]',
  md: 'px-3 py-1 text-xs',
  inline: 'px-2 py-0.5',
};

const TONES: Record<ChipTone, string> = {
  muted: 'bg-line/60 text-ink-muted',
  strong: 'bg-line/60 text-ink',
  accent: 'bg-marigold text-on-marigold',
  warning: 'bg-marigold/25 text-ink',
  outline: 'border border-line text-ink-muted',
  teal: 'border border-teal bg-teal/5 text-teal',
  tealSoft: 'bg-teal/15 text-teal',
  danger: 'bg-rose/10 text-rose',
};

/** A small status or tag pill; native span props and className pass through. */
export function Chip({
  children,
  tone = 'muted',
  size = 'md',
  className = '',
  ...props
}: ChipProps) {
  return (
    <span className={`${BASE} ${SIZES[size]} ${TONES[tone]} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
