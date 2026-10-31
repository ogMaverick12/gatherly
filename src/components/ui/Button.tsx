import type { ButtonHTMLAttributes } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';
export type ButtonTone = 'default' | 'neutral' | 'ink' | 'teal' | 'danger';
export type ButtonSize = 'default' | 'compact' | 'small' | 'large' | 'none';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  tone?: ButtonTone;
  size?: ButtonSize;
}

const BASE =
  'inline-flex min-h-11 items-center justify-center rounded-pill transition duration-200 disabled:cursor-not-allowed disabled:opacity-60';

const SIZES: Record<ButtonSize, string> = {
  default: 'px-6 py-2.5 text-sm font-semibold',
  compact: 'px-4 py-2 text-sm font-medium',
  small: 'px-3 py-1.5 text-sm font-medium',
  large: 'px-7 py-3 text-sm font-semibold',
  none: '',
};

const TONES: Record<ButtonVariant, Record<ButtonTone, string>> = {
  primary: {
    default: 'bg-ink text-paper',
    neutral: 'bg-ink text-paper',
    ink: 'bg-ink text-paper',
    teal: 'bg-teal text-paper',
    danger: 'bg-rose text-paper',
  },
  secondary: {
    default: 'border border-line-strong text-ink hover:border-ink hover:bg-raised',
    neutral: 'border border-line bg-raised text-ink hover:border-line-strong',
    ink: 'border border-ink text-ink hover:bg-ink hover:text-paper',
    teal: 'border border-teal text-teal hover:bg-teal hover:text-paper',
    danger: 'border border-rose text-rose hover:bg-rose hover:text-paper',
  },
  quiet: {
    default: 'text-ink-muted hover:text-ink',
    neutral: 'text-ink hover:text-teal',
    ink: 'text-ink hover:text-teal',
    teal: 'text-teal hover:text-teal-deep',
    danger: 'text-ink-muted hover:text-rose',
  },
};

/** Build the class list shared by buttons and button-styled links. */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  tone: ButtonTone = 'default',
  size: ButtonSize = 'default',
  className = '',
): string {
  return `${BASE} ${SIZES[size]} ${TONES[variant][tone]} ${className}`.trim();
}

/** A native button with the shared touch target, variants and native props. */
export function Button({
  variant = 'primary',
  tone = 'default',
  size = 'default',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={buttonClasses(variant, tone, size, className)} {...props} />
  );
}
