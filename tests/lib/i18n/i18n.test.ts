import { describe, expect, it } from 'vitest';
import { DICTIONARIES, dictionaryKeyPaths, getDictionary, LANGUAGE_TAGS } from '@/lib/i18n';
import { LANGUAGES } from '@/lib/plan';
import { asInvalid } from '@tests/support/factories';

describe('the dictionaries', () => {
  it('cover every language the app offers', () => {
    for (const language of LANGUAGES) {
      expect(DICTIONARIES[language]).toBeDefined();
    }
  });

  it('have exactly the same keys in every language', () => {
    const english = dictionaryKeyPaths(DICTIONARIES.en);
    for (const language of LANGUAGES) {
      expect(dictionaryKeyPaths(DICTIONARIES[language])).toEqual(english);
    }
  });

  it('have no empty strings', () => {
    for (const language of LANGUAGES) {
      const walk = (value: unknown, path: string) => {
        if (typeof value === 'string') {
          expect(value.trim(), `${language}:${path}`).not.toBe('');
          return;
        }
        if (value && typeof value === 'object') {
          for (const [key, child] of Object.entries(value)) {
            walk(child, `${path}.${key}`);
          }
        }
      };
      walk(DICTIONARIES[language], '');
    }
  });

  it('fall back to English for an unknown language', () => {
    expect(getDictionary(asInvalid('zz'))).toBe(DICTIONARIES.en);
  });

  it('give a BCP-47 tag for every language', () => {
    for (const language of LANGUAGES) {
      expect(LANGUAGE_TAGS[language]).toBe(language);
    }
  });
});
