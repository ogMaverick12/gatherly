/**
 * The hand-drawn garland line.
 *
 * A single uneven curve with a few beads on it, drawn as one path so it
 * scales cleanly and never costs a layout shift.
 */
export function GarlandLine({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 90"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 26c86 30 168 44 246 30 74-13 118-56 196-46 82 10 122 60 214 54 96-6 132-64 226-56 92 8 140 54 236 40 44-6 76-20 116-30"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.45"
      />
      <path
        d="M40 30c70 22 138 32 202 22 68-11 106-44 172-38 72 7 108 48 190 44 84-4 118-52 200-47 84 5 126 42 208 32"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        opacity="0.3"
      />
      {[
        { x: 120, y: 44, r: 4.5 },
        { x: 246, y: 56, r: 3.5 },
        { x: 372, y: 34, r: 5 },
        { x: 498, y: 22, r: 3.5 },
        { x: 624, y: 34, r: 4.5 },
        { x: 748, y: 46, r: 3.5 },
        { x: 872, y: 44, r: 5 },
        { x: 1000, y: 28, r: 3.5 },
        { x: 1112, y: 12, r: 4 },
      ].map((bead) => (
        <circle
          key={`${bead.x}-${bead.y}`}
          cx={bead.x}
          cy={bead.y}
          r={bead.r}
          fill="var(--color-marigold)"
          opacity="0.85"
        />
      ))}
    </svg>
  );
}
