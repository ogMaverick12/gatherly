import type { HealthBand } from '@/features/health/services';

const BAND_COLOR: Record<HealthBand, string> = {
  on_track: 'var(--color-teal)',
  attention: 'var(--color-marigold)',
  at_risk: 'var(--color-rose)',
};

export function HealthRing({
  score,
  band,
  size = 112,
  label,
}: {
  score: number;
  band: HealthBand;
  size?: number;
  label: string;
}) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const offset = circumference * (1 - clamped / 100);
  const colour = BAND_COLOR[band];

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${clamped} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={colour}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 420ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-semibold leading-none">{clamped}</span>
        <span className="mt-0.5 text-[0.6rem] uppercase tracking-[0.18em] text-ink-muted">
          / 100
        </span>
      </span>
    </div>
  );
}

/** The marigold "celebration dot" status marker. */
export function CelebrationDot({
  status,
  className = '',
}: {
  status: 'done' | 'waiting' | 'late' | 'neutral';
  className?: string;
}) {
  const colour =
    status === 'done'
      ? 'var(--color-teal)'
      : status === 'late'
        ? 'var(--color-rose)'
        : status === 'waiting'
          ? 'var(--color-marigold)'
          : 'var(--color-line-strong)';

  return (
    <span
      aria-hidden="true"
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${className}`}
      style={{ backgroundColor: colour }}
    />
  );
}
