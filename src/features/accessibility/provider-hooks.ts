'use client';

import { startTransition, useCallback, useEffect, useMemo, useState } from 'react';
import { LANGUAGE_TAGS } from '@/lib/i18n';
import type { Language } from '@/lib/plan';
import {
  DEFAULT_PREFERENCES,
  readStoredPreferences,
  writeStoredPreferences,
  type AccessibilityPreferences,
  type ThemePreference,
} from './preferences';

/** Read stored preferences after paint and expose the update helper. */
export function useHydratedPreferences(initialLanguage?: Language) {
  // Start from server-safe defaults and apply storage after hydration: reading
  // it during the first render would make the markup disagree with the server.
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredPreferences();
    // Preferences are device polish, not the critical path: let the shell paint
    // first and apply them as a non-urgent update.
    startTransition(() => {
      setPreferences(initialLanguage ? { ...stored, language: initialLanguage } : stored);
      setReady(true);
    });
  }, [initialLanguage]);

  const update = useCallback((patch: Partial<AccessibilityPreferences>) => {
    setPreferences((current) => ({ ...current, ...patch }));
  }, []);

  return { preferences, ready, update };
}

/** Resolve speech support once on the client, without a second tree render. */
export function useSpeechSupport(): boolean {
  const [supported] = useState(
    () =>
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof window.SpeechSynthesisUtterance === 'function',
  );
  return supported;
}

/** Resolve the system theme when the preference asks for it. */
export function useResolvedTheme(theme: ThemePreference): 'light' | 'dark' {
  return useMemo<'light' | 'dark'>(() => {
    if (theme !== 'system') return theme;
    if (typeof window === 'undefined' || !window.matchMedia) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, [theme]);
}

/** Mirror preferences onto the document root only when a value differs. */
export function useDocumentPreferences(
  preferences: AccessibilityPreferences,
  resolvedTheme: 'light' | 'dark',
) {
  useEffect(() => {
    const root = document.documentElement;
    // Do not write an attribute the server already rendered. Redundant root
    // writes invalidate style after paint for no visual change.
    if (root.dataset['theme'] !== resolvedTheme) root.dataset['theme'] = resolvedTheme;
    if (root.dataset['textSize'] !== preferences.textSize) {
      root.dataset['textSize'] = preferences.textSize;
    }
    if (root.dataset['calm'] !== String(preferences.calmMode)) {
      root.dataset['calm'] = preferences.calmMode ? 'true' : 'false';
    }
    if (root.dataset['motion'] !== (preferences.reducedMotion ? 'off' : 'on')) {
      root.dataset['motion'] = preferences.reducedMotion ? 'off' : 'on';
    }
    const languageTag = LANGUAGE_TAGS[preferences.language];
    if (root.lang !== languageTag) root.lang = languageTag;
  }, [preferences, resolvedTheme]);
}

/** Persist preference changes after the initial stored read has settled. */
export function usePersistedPreferences(preferences: AccessibilityPreferences, ready: boolean) {
  useEffect(() => {
    if (!ready) return;
    writeStoredPreferences(preferences);
  }, [preferences, ready]);
}

/** Speech controls bound to the current calm-mode and language choices. */
export function useSpeech(preferences: AccessibilityPreferences, speechSupported: boolean) {
  const [speaking, setSpeaking] = useState(false);

  const stopSpeaking = useCallback(() => {
    if (typeof window === 'undefined' || !speechSupported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [speechSupported]);

  const speak = useCallback(
    (text: string) => {
      if (!speechSupported || !text.trim()) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new window.SpeechSynthesisUtterance(text);
        utterance.lang = LANGUAGE_TAGS[preferences.language];
        utterance.rate = preferences.calmMode ? 0.9 : 1;
        utterance.onend = () => setSpeaking(false);
        utterance.onerror = () => setSpeaking(false);
        setSpeaking(true);
        window.speechSynthesis.speak(utterance);
      } catch {
        setSpeaking(false);
      }
    },
    [preferences.calmMode, preferences.language, speechSupported],
  );

  return { speaking, speak, stopSpeaking };
}
