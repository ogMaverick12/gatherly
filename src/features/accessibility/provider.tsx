'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { z } from 'zod';
import type { Language } from '@/lib/plan';
import { getDictionary, LANGUAGE_TAGS, type Dictionary } from '@/lib/i18n';

/**
 * Accessibility and display preferences.
 *
 * Everything the user can change about how the app looks, reads and moves
 * lives here. The values are stored on the device, validated on read (local
 * storage is untrusted), and applied to the document element so CSS can
 * react to them without React re-rendering the whole tree.
 */

export type ThemePreference = 'light' | 'dark' | 'system';
export type TextSize = 'standard' | 'large' | 'xlarge';

export interface AccessibilityPreferences {
  readonly language: Language;
  readonly theme: ThemePreference;
  readonly textSize: TextSize;
  readonly calmMode: boolean;
  readonly reducedMotion: boolean;
}

const STORAGE_KEY = 'gatherly:prefs:v1';

const PreferencesSchema = z
  .object({
    language: z.enum(['en', 'hi', 'bn']),
    theme: z.enum(['light', 'dark', 'system']),
    textSize: z.enum(['standard', 'large', 'xlarge']),
    calmMode: z.boolean(),
    reducedMotion: z.boolean(),
  })
  .strict();

export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  language: 'en',
  theme: 'system',
  textSize: 'standard',
  calmMode: false,
  reducedMotion: false,
};

function readStoredPreferences(): AccessibilityPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = PreferencesSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function writeStoredPreferences(preferences: AccessibilityPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage can be unavailable (private mode, quota). The app still works.
  }
}

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

// long-function: one view section, kept in one block so its reading order stays visible.
export function AccessibilityProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage?: Language;
}) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(() => {
    const stored = readStoredPreferences();
    return initialLanguage ? { ...stored, language: initialLanguage } : stored;
  });
  const [speaking, setSpeaking] = useState(false);

  const speechSupported = useMemo(
    () =>
      typeof window !== 'undefined' &&
      'speechSynthesis' in window &&
      typeof window.SpeechSynthesisUtterance === 'function',
    [],
  );

  const resolvedTheme = useMemo<'light' | 'dark'>(() => {
    if (preferences.theme !== 'system') return preferences.theme;
    if (typeof window === 'undefined' || !window.matchMedia) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, [preferences.theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset['theme'] = resolvedTheme;
    root.dataset['textSize'] = preferences.textSize;
    root.dataset['calm'] = preferences.calmMode ? 'true' : 'false';
    root.dataset['motion'] = preferences.reducedMotion ? 'off' : 'on';
    root.lang = LANGUAGE_TAGS[preferences.language];
  }, [preferences, resolvedTheme]);

  useEffect(() => {
    writeStoredPreferences(preferences);
  }, [preferences]);

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

export function useAccessibility(): AccessibilityContextValue {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used inside an AccessibilityProvider');
  }
  return context;
}
