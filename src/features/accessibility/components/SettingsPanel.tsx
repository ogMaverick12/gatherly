'use client';

/**
 * The open display-settings panel and its lower controls.
 */

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { Dictionary } from '@/lib/i18n';
import type { AccessibilityPreferences, TextSize, ThemePreference } from '../preferences';
import { TextSizeFieldset, ThemeFieldset } from './DisplaySettingsControls';

/** The calm-mode and reduced-motion switches. */
export function ModeToggles({
  dictionary,
  calmMode,
  reducedMotion,
  onCalmChange,
  onMotionChange,
}: {
  readonly dictionary: Dictionary;
  readonly calmMode: boolean;
  readonly reducedMotion: boolean;
  readonly onCalmChange: (enabled: boolean) => void;
  readonly onMotionChange: (enabled: boolean) => void;
}) {
  return (
    <div className="mt-4 space-y-2">
      <label
        htmlFor="gatherly-calm-mode"
        className="grid min-h-11 cursor-pointer grid-cols-[auto_1fr] items-start gap-x-3 rounded-card border border-line px-3 py-2 text-sm"
      >
        <input
          id="gatherly-calm-mode"
          type="checkbox"
          checked={calmMode}
          onChange={(event) => onCalmChange(event.target.checked)}
          className="mt-0.5 h-5 w-5 accent-[var(--color-teal)]"
        />
        <span className="font-semibold text-ink">{dictionary.accessibility.calmMode}</span>
        <span className="col-start-2 mt-0.5 block text-ink-muted">
          {dictionary.accessibility.calmModeHelp}
        </span>
      </label>

      <label
        htmlFor="gatherly-reduced-motion"
        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-card border border-line px-3 text-sm"
      >
        <input
          id="gatherly-reduced-motion"
          type="checkbox"
          checked={reducedMotion}
          onChange={(event) => onMotionChange(event.target.checked)}
          className="h-5 w-5 accent-[var(--color-teal)]"
        />
        <span className="font-semibold text-ink">{dictionary.accessibility.reducedMotion}</span>
      </label>
    </div>
  );
}

/** The speech control, or its unsupported fallback. */
export function SpeechControl({
  dictionary,
  speechSupported,
  speaking,
  onToggle,
}: {
  readonly dictionary: Dictionary;
  readonly speechSupported: boolean;
  readonly speaking: boolean;
  readonly onToggle: () => void;
}) {
  if (!speechSupported) {
    return <p className="text-sm text-ink-muted">{dictionary.accessibility.speechUnavailable}</p>;
  }
  return (
    <Button onClick={onToggle} variant="secondary" tone="neutral" size="small">
      {speaking ? dictionary.accessibility.stopReading : dictionary.accessibility.readAloud}
    </Button>
  );
}

/** The open settings panel: header, three preference groups and speech. */
export function SettingsPanel({
  dictionary,
  preferences,
  panelId,
  onClose,
  setTextSize,
  setTheme,
  setCalmMode,
  setReducedMotion,
  speechSupported,
  speaking,
  onSpeechToggle,
}: {
  readonly dictionary: Dictionary;
  readonly preferences: AccessibilityPreferences;
  readonly panelId: string;
  readonly onClose: () => void;
  readonly setTextSize: (size: TextSize) => void;
  readonly setTheme: (theme: ThemePreference) => void;
  readonly setCalmMode: (enabled: boolean) => void;
  readonly setReducedMotion: (enabled: boolean) => void;
  readonly speechSupported: boolean;
  readonly speaking: boolean;
  readonly onSpeechToggle: () => void;
}) {
  return (
    <Card
      id={panelId}
      padding="md"
      className="absolute end-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] shadow-lift"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-lg">{dictionary.accessibility.title}</h2>
        <Button onClick={onClose} variant="quiet" size="small">
          {dictionary.common.close}
        </Button>
      </div>

      <TextSizeFieldset
        dictionary={dictionary}
        textSize={preferences.textSize}
        onChange={setTextSize}
      />
      <ThemeFieldset dictionary={dictionary} theme={preferences.theme} onChange={setTheme} />
      <ModeToggles
        dictionary={dictionary}
        calmMode={preferences.calmMode}
        reducedMotion={preferences.reducedMotion}
        onCalmChange={setCalmMode}
        onMotionChange={setReducedMotion}
      />

      <div className="mt-4 border-t border-line pt-3">
        <SpeechControl
          dictionary={dictionary}
          speechSupported={speechSupported}
          speaking={speaking}
          onToggle={onSpeechToggle}
        />
      </div>
    </Card>
  );
}
