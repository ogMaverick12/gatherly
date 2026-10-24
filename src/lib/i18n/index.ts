import type { Language } from '@/lib/plan';
import { en, type Dictionary } from './en';
import { hi } from './hi';
import { bn } from './bn';

export type { Dictionary } from './en';
export { en } from './en';
export { hi } from './hi';
export { bn } from './bn';

export const DICTIONARIES: Record<Language, Dictionary> = { en, hi, bn };

export function getDictionary(language: Language): Dictionary {
  return DICTIONARIES[language] ?? DICTIONARIES.en;
}

/** Flattened key paths, used by the locale-parity test. */
export function dictionaryKeyPaths(dictionary: Dictionary): string[] {
  const paths: string[] = [];

  const walk = (value: unknown, prefix: string) => {
    if (typeof value === 'string') {
      paths.push(prefix);
      return;
    }
    if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        walk(child, prefix ? `${prefix}.${key}` : key);
      }
    }
  };

  walk(dictionary, '');
  return paths.sort();
}

/** The BCP-47 tag for a language, used for the document lang and speech. */
export const LANGUAGE_TAGS: Record<Language, string> = {
  en: 'en',
  hi: 'hi',
  bn: 'bn',
};
