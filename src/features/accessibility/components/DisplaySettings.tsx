'use client';

/**
 * Display and access settings in a disclosure.
 * Text size, theme, calm mode, motion and speech live here.
 */

import { useId, useState } from 'react';
import { useAccessibility } from '../provider';
import { SettingsTrigger } from './display-settings-controls';
import { SettingsPanel } from './settings-panel';

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
      <SettingsTrigger
        dictionary={dictionary}
        open={open}
        panelId={panelId}
        onToggle={() => setOpen((value) => !value)}
      />
      {open ? (
        <SettingsPanel
          dictionary={dictionary}
          preferences={preferences}
          panelId={panelId}
          onClose={() => setOpen(false)}
          setTextSize={setTextSize}
          setTheme={setTheme}
          setCalmMode={setCalmMode}
          setReducedMotion={setReducedMotion}
          speechSupported={speechSupported}
          speaking={speaking}
          onSpeechToggle={() => (speaking ? stopSpeaking() : speak(dictionary.landing.heroBody))}
        />
      ) : null}
    </div>
  );
}
