import Link from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { buttonClasses, type ButtonSize, type ButtonTone, type ButtonVariant } from './Button';

/** Props accepted by the link styled as a button. */
export interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
  external?: boolean;
}

/**
 * A link styled as a button.
 *
 * Internal links use the Next.js client router; `external` keeps ordinary
 * anchors for links that leave the app or open another tab.
 */
export function ButtonLink({
  href,
  children,
  variant = 'primary',
  tone = 'default',
  size = 'default',
  external = false,
  className = '',
  ...props
}: ButtonLinkProps) {
  const classes = buttonClasses(variant, tone, size, className);
  if (external) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes} {...props}>
      {children}
    </Link>
  );
}
