import type { HTMLAttributes, ReactNode } from 'react';

/** Props accepted by the stat row component. */
export interface StatRowProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** A label-and-value row aligned on the text baseline. */
export function StatRow({ children, className = '', ...props }: StatRowProps) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${className}`.trim()} {...props}>
      {children}
    </div>
  );
}
