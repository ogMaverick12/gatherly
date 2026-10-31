/**
 * The Gatherly wordmark and its four-point celebration mark.
 * Both draw from the current colour, so they inherit the surrounding text colour.
 */

/** Render the Gatherly name beside the celebration mark. */
export function Wordmark({ className = '', markLabel }: { className?: string; markLabel: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <CelebrationMark className="h-5 w-5 shrink-0" label={markLabel} />
      <span className="font-display text-xl font-semibold tracking-tight">Gatherly</span>
    </span>
  );
}

/**
 * The four-point celebration mark.
 * Four petals around a small centre, drawn rather than typed so it stays
 * crisp at any size and inherits the current colour.
 */
export function CelebrationMark({ className = '', label }: { className?: string; label: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={label}
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 0.75c.62 3.9 1.6 5.85 3.4 7.1 1.2.85 2.75 1.1 6.85 1.4-3.4.3-5.1.6-6.35 1.45-1.8 1.2-2.8 3.15-3.9 7.05-.62-3.9-1.6-5.85-3.4-7.1C7.4 9.75 5.85 9.5 1.75 9.25c3.4-.3 5.1-.6 6.35-1.45C9.9 6.6 10.9 4.65 12 .75Z"
        fill="currentColor"
      />
      <circle cx="12" cy="11.75" r="1.6" fill="var(--color-paper)" />
    </svg>
  );
}
