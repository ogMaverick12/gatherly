'use client';

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getDictionary, LANGUAGE_TAGS, type Dictionary } from '@/lib/i18n';
import type { Language } from '@/lib/plan';
import {
  DEFAULT_PREFERENCES,
  readStoredPreferences,
  writeStoredPreferences,
  type AccessibilityPreferences,
  type TextSize,
  type ThemePreference,
} from './preferences';

export { DEFAULT_PREFERENCES, writeStoredPreferences } from './preferences';
export type { AccessibilityPreferences, TextSize, ThemePreference } from './preferences';

/**
 * Accessibility context: preferences, dictionary, speech and document mirroring.
 * Storage rules live in preferences.ts so this file stays about React.
 */

export interface AccessibilityContextValue {
  readonly preferences: AccessibilityPreferences;
  readonly dictionary: Dictionary;
  readonly speechSupported: boolean;
  readonly speaking: boolean;
  setLanguage: (language: Language) => void;
  setTheme: (theme: ThemePreference) => void;
  setTextSize: (size: TextSize) => void;
  setCalmMode: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  speak: (text: string) => void;
  stopSpeaking: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

/**
 * Supplies preferences, the dictionary and speech, mirroring choices onto the root element.
 * @param props children plus an optional language resolved on the server
 * @returns the provider element wrapping the children
 */
// long-function: one view section, kept in one block so its reading order stays visible.
export function AccessibilityProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage?: Language;
}) {
  // Start from server-safe defaults and apply storage after hydration: reading
  // it during the first render would make the markup disagree with the server.
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES);
  const [ready, setReady] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  // Speech is only rendered behind the closed display-settings menu, so this
  // can be resolved on the first client render without a second tree render.
  const [speechSupported] = useState(
    () =>
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof window.SpeechSynthesisUtterance === 'function',
  );

  useEffect(() => {
    const stored = readStoredPreferences();
    // Preferences are device polish, not the critical path: let the shell paint
    // first and apply them as a non-urgent update.
    startTransition(() => {
      setPreferences(initialLanguage ? { ...stored, language: initialLanguage } : stored);
      setReady(true);
    });
  }, [initialLanguage]);

  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (preferences.theme !== 'system') return preferences.theme;
    if (typeof window === 'undefined' || !window.matchMedia) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, [preferences.theme]);

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

  useEffect(() => {
    if (!ready) return;
    writeStoredPreferences(preferences);
  }, [preferences, ready]);

  const update = useCallback((patch: Partial<AccessibilityPreferences>) => {
    setPreferences((current) => ({ ...current, ...patch }));
  }, []);

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

  const value = useMemo<AccessibilityContextValue>(
    () => ({
      preferences,
      dictionary: getDictionary(preferences.language),
      speechSupported,
      speaking,
      setLanguage: (language) => update({ language }),
      setTheme: (theme) => update({ theme }),
      setTextSize: (textSize) => update({ textSize }),
      setCalmMode: (calmMode) => update({ calmMode }),
      setReducedMotion: (reducedMotion) => update({ reducedMotion }),
      speak,
      stopSpeaking,
    }),
    [preferences, speaking, speak, speechSupported, stopSpeaking, update],
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

/**
 * Reads the shared accessibility context.
 * @returns the current preferences, dictionary and setters
 * @throws when called outside an AccessibilityProvider
 */
export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used inside an AccessibilityProvider');
  }
  return context;
}
