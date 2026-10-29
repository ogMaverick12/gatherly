import { z } from 'zod';
import type { Language } from '@/lib/plan';

/**
 * Display preferences on this device: schema, defaults and storage.
 * The provider applies these values; keeping the storage rules here keeps it small.
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

/** The preferences used before anything is stored on this device. */
export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  language: 'en',
  theme: 'system',
  textSize: 'standard',
  calmMode: false,
  reducedMotion: false,
};

/** Read and validate the stored preferences, falling back to the defaults. */
export function readStoredPreferences(): AccessibilityPreferences {
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

/** Write the preference set to local storage, ignoring private-mode failures. */
export function writeStoredPreferences(preferences: AccessibilityPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Storage can be unavailable (private mode, quota). The app still works.
  }
}
