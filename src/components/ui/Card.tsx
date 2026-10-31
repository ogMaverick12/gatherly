import type { HTMLAttributes, ReactNode } from 'react';

export type CardTone = 'raised' | 'paper' | 'teal' | 'attention' | 'user';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type CardElement = 'div' | 'li' | 'section' | 'article' | 'p' | 'details';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: CardElement;
  children: ReactNode;
  tone?: CardTone;
  padding?: CardPadding;
}

const BASE = 'rounded-card border';

const TONES: Record<CardTone, string> = {
  raised: 'border-line bg-raised',
  paper: 'border-line bg-paper',
  teal: 'border-teal bg-teal/5',
  attention: 'border-marigold bg-marigold/10',
  user: 'border-teal/40 bg-teal/10',
};

const PADDING: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  xl: 'p-6',
};

/** Build the class list for a card surface. */
export function cardClasses(
  tone: CardTone = 'raised',
  padding: CardPadding = 'none',
  className = '',
) {
  return `${BASE} ${TONES[tone]} ${PADDING[padding]} ${className}`.trim();
}

/** A themed card surface; choose the element with `as`, props pass through. */
export function Card({
  as: Element = 'div',
  children,
  tone = 'raised',
  padding = 'none',
  className = '',
  ...props
}: CardProps) {
  return (
    <Element className={cardClasses(tone, padding, className)} {...props}>
      {children}
    </Element>
  );
}
