'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { getDictionary, type Dictionary } from '@/lib/i18n';
import type { Language } from '@/lib/plan';
import type { AccessibilityPreferences, TextSize, ThemePreference } from './preferences';
import {
  useDocumentPreferences,
  useHydratedPreferences,
  usePersistedPreferences,
  useResolvedTheme,
  useSpeech,
  useSpeechSupport,
} from './use-accessibility';

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

/** The preferences and speech controls that make up the context value. */
interface AccessibilityValueInput {
  readonly preferences: AccessibilityPreferences;
  readonly speechSupported: boolean;
  readonly speaking: boolean;
  readonly speak: (text: string) => void;
  readonly stopSpeaking: () => void;
  readonly update: (patch: Partial<AccessibilityPreferences>) => void;
}

/** Build the stable context value from preferences and speech controls. */
function useAccessibilityValue({
  preferences,
  speechSupported,
  speaking,
  speak,
  stopSpeaking,
  update,
}: AccessibilityValueInput): AccessibilityContextValue {
  return useMemo(
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
}

/**
 * Supplies preferences, the dictionary and speech, mirroring choices onto the root element.
 * @param props children plus an optional language resolved on the server
 * @returns the provider element wrapping the children
 */
export function AccessibilityProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage?: Language;
}) {
  const { preferences, ready, update } = useHydratedPreferences(initialLanguage);
  const speechSupported = useSpeechSupport();
  const { speaking, speak, stopSpeaking } = useSpeech(preferences, speechSupported);
  const resolvedTheme = useResolvedTheme(preferences.theme);
  useDocumentPreferences(preferences, resolvedTheme);
  usePersistedPreferences(preferences, ready);
  const value = useAccessibilityValue({
    preferences,
    speechSupported,
    speaking,
    speak,
    stopSpeaking,
    update,
  });
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
