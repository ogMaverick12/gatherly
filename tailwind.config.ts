import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--color-paper)',
        raised: 'var(--color-paper-raised)',
        ink: 'var(--color-ink)',
        'ink-muted': 'var(--color-ink-muted)',
        marigold: 'var(--color-marigold)',
        'marigold-ink': 'var(--color-marigold-ink)',
        'on-marigold': 'var(--color-on-marigold)',
        teal: 'var(--color-teal)',
        'teal-deep': 'var(--color-teal-deep)',
        rose: 'var(--color-rose)',
        line: 'var(--color-line)',
        'line-strong': 'var(--color-line-strong)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Iowan Old Style', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'Segoe UI', 'sans-serif'],
        devanagari: ['var(--font-devanagari)', 'Noto Sans Devanagari', 'sans-serif'],
        bengali: ['var(--font-bengali)', 'Noto Sans Bengali', 'sans-serif'],
      },
      fontSize: {
        'display-sm': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        display: ['2.75rem', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        'display-lg': ['3.75rem', { lineHeight: '1.04', letterSpacing: '-0.03em' }],
        'title-lg': ['1.75rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        title: ['1.375rem', { lineHeight: '1.3' }],
        body: ['1rem', { lineHeight: '1.65' }],
        small: ['0.875rem', { lineHeight: '1.5' }],
        micro: ['0.75rem', { lineHeight: '1.4' }],
      },
      borderRadius: {
        card: '1.25rem',
        pill: '999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(31, 26, 23, 0.04), 0 12px 32px -18px rgba(31, 26, 23, 0.28)',
        lift: '0 2px 4px rgba(31, 26, 23, 0.05), 0 24px 48px -24px rgba(31, 26, 23, 0.32)',
        ring: '0 0 0 3px var(--color-focus)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      maxWidth: {
        prose: '68ch',
      },
    },
  },
  plugins: [],
};

export default config;
