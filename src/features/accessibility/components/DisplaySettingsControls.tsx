'use client';

/**
 * The trigger and choice groups inside the display-settings disclosure.
 */

import { Button } from '@/components/ui/Button';
import type { Dictionary } from '@/lib/i18n';
import type { TextSize, ThemePreference } from '../preferences';

const TEXT_SIZES: {
  value: TextSize;
  key: 'textSizeStandard' | 'textSizeLarge' | 'textSizeXLarge';
}[] = [
  { value: 'standard', key: 'textSizeStandard' },
  { value: 'large', key: 'textSizeLarge' },
  { value: 'xlarge', key: 'textSizeXLarge' },
];

const THEMES: { value: ThemePreference; key: 'themeLight' | 'themeDark' | 'themeSystem' }[] = [
  { value: 'light', key: 'themeLight' },
  { value: 'dark', key: 'themeDark' },
  { value: 'system', key: 'themeSystem' },
];

/** The button that opens and closes the settings disclosure. */
export function SettingsTrigger({
  dictionary,
  open,
  panelId,
  onToggle,
}: {
  readonly dictionary: Dictionary;
  readonly open: boolean;
  readonly panelId: string;
  readonly onToggle: () => void;
}) {
  return (
    <Button
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={panelId}
      variant="secondary"
      tone="neutral"
      size="small"
      className="gap-2"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18M12 3a9 9 0 0 1 0 18" fill="currentColor" stroke="none" opacity="0.35" />
      </svg>
      <span className="hidden sm:inline">{dictionary.accessibility.title}</span>
      <span className="sm:hidden">Aa</span>
    </Button>
  );
}

/** The text-size radio group. */
export function TextSizeFieldset({
  dictionary,
  textSize,
  onChange,
}: {
  readonly dictionary: Dictionary;
  readonly textSize: TextSize;
  readonly onChange: (size: TextSize) => void;
}) {
  return (
    <fieldset className="mt-3">
      <legend className="text-sm font-semibold text-ink">
        {dictionary.accessibility.textSize}
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {TEXT_SIZES.map((size) => (
          <label
            key={size.value}
            className={`inline-flex min-h-11 cursor-pointer items-center rounded-pill border px-3 text-sm ${
              textSize === size.value ? 'border-ink bg-ink text-paper' : 'border-line text-ink'
            }`}
          >
            <input
              type="radio"
              name="text-size"
              value={size.value}
              checked={textSize === size.value}
              onChange={() => onChange(size.value)}
              className="sr-only"
            />
            {dictionary.accessibility[size.key]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** The theme radio group. */
export function ThemeFieldset({
  dictionary,
  theme,
  onChange,
}: {
  readonly dictionary: Dictionary;
  readonly theme: ThemePreference;
  readonly onChange: (theme: ThemePreference) => void;
}) {
  return (
    <fieldset className="mt-4">
      <legend className="text-sm font-semibold text-ink">{dictionary.accessibility.theme}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {THEMES.map((option) => (
          <label
            key={option.value}
            className={`inline-flex min-h-11 cursor-pointer items-center rounded-pill border px-3 text-sm ${
              theme === option.value ? 'border-ink bg-ink text-paper' : 'border-line text-ink'
            }`}
          >
            <input
              type="radio"
              name="theme"
              value={option.value}
              checked={theme === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            {dictionary.accessibility[option.key]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
