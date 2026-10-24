'use client';

import { useId, useState } from 'react';
import { useAccessibility, type TextSize, type ThemePreference } from '../provider';

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

/**
 * Display and access settings.
 *
 * A disclosure rather than a modal, so it can be opened with a keyboard and
 * read in place. Every control is a real form control with a label.
 */
export function DisplaySettings() {
  const {
    dictionary,
    preferences,
    setTextSize,
    setTheme,
    setCalmMode,
    setReducedMotion,
    speechSupported,
    speaking,
    speak,
    stopSpeaking,
  } = useAccessibility();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-pill border border-line bg-raised px-3 text-sm text-ink transition-colors hover:border-line-strong"
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
      </button>

      {open ? (
        <div
          id={panelId}
          className="absolute end-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-card border border-line bg-raised p-4 shadow-lift"
        >
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-lg">{dictionary.accessibility.title}</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-[44px] rounded-pill px-3 text-sm text-ink-muted hover:text-ink"
            >
              {dictionary.common.close}
            </button>
          </div>

          <fieldset className="mt-3">
            <legend className="text-sm font-semibold text-ink">
              {dictionary.accessibility.textSize}
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {TEXT_SIZES.map((size) => (
                <label
                  key={size.value}
                  className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-pill border px-3 text-sm ${
                    preferences.textSize === size.value
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line text-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name="text-size"
                    value={size.value}
                    checked={preferences.textSize === size.value}
                    onChange={() => setTextSize(size.value)}
                    className="sr-only"
                  />
                  {dictionary.accessibility[size.key]}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-4">
            <legend className="text-sm font-semibold text-ink">
              {dictionary.accessibility.theme}
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {THEMES.map((theme) => (
                <label
                  key={theme.value}
                  className={`inline-flex min-h-[44px] cursor-pointer items-center rounded-pill border px-3 text-sm ${
                    preferences.theme === theme.value
                      ? 'border-ink bg-ink text-paper'
                      : 'border-line text-ink'
                  }`}
                >
                  <input
                    type="radio"
                    name="theme"
                    value={theme.value}
                    checked={preferences.theme === theme.value}
                    onChange={() => setTheme(theme.value)}
                    className="sr-only"
                  />
                  {dictionary.accessibility[theme.key]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 space-y-2">
            <label
              htmlFor="gatherly-calm-mode"
              className="grid min-h-[44px] cursor-pointer grid-cols-[auto_1fr] items-start gap-x-3 rounded-card border border-line px-3 py-2 text-sm"
            >
              <input
                id="gatherly-calm-mode"
                type="checkbox"
                checked={preferences.calmMode}
                onChange={(event) => setCalmMode(event.target.checked)}
                className="mt-0.5 h-5 w-5 accent-[var(--color-teal)]"
              />
              <span className="font-semibold text-ink">{dictionary.accessibility.calmMode}</span>
              <span className="col-start-2 mt-0.5 block text-ink-muted">
                {dictionary.accessibility.calmModeHelp}
              </span>
            </label>

            <label
              htmlFor="gatherly-reduced-motion"
              className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-card border border-line px-3 text-sm"
            >
              <input
                id="gatherly-reduced-motion"
                type="checkbox"
                checked={preferences.reducedMotion}
                onChange={(event) => setReducedMotion(event.target.checked)}
                className="h-5 w-5 accent-[var(--color-teal)]"
              />
              <span className="font-semibold text-ink">
                {dictionary.accessibility.reducedMotion}
              </span>
            </label>
          </div>

          <div className="mt-4 border-t border-line pt-3">
            {speechSupported ? (
              <button
                type="button"
                onClick={() => (speaking ? stopSpeaking() : speak(dictionary.landing.heroBody))}
                className="min-h-[44px] rounded-pill border border-line px-4 text-sm text-ink hover:border-line-strong"
              >
                {speaking
                  ? dictionary.accessibility.stopReading
                  : dictionary.accessibility.readAloud}
              </button>
            ) : (
              <p className="text-sm text-ink-muted">{dictionary.accessibility.speechUnavailable}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
