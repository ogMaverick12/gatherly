import { FlatCompat } from '@eslint/eslintrc';
import importPlugin from 'eslint-plugin-import';
import vitest from 'eslint-plugin-vitest';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const filename = fileURLToPath(import.meta.url);
const directory = path.dirname(filename);

// Discover feature folders at lint time so a new feature gets its boundary
// without a second list that can drift.
const featureNames = readdirSync(new URL('./src/features', import.meta.url), {
  withFileTypes: true,
})
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

// A feature may import another feature only through its public index. Shared
// code lives in src/lib, which may not import a feature at all.
const importZones = [
  ...featureNames.flatMap((target) =>
    featureNames
      .filter((from) => from !== target)
      .map((from) => ({
        target: `./src/features/${target}`,
        from: `./src/features/${from}`,
        except: ['./index.ts'],
      })),
  ),
  { target: './src/lib', from: './src/features' },
];

const compat = new FlatCompat({ baseDirectory: directory });

/**
 * Lint rules beyond the Next.js defaults: jsx-a11y, import/no-cycle,
 * import/no-restricted-paths for feature boundaries, vitest/no-focused-tests,
 * and complexity limits.
 */
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript', 'plugin:jsx-a11y/recommended'),
  {
    plugins: { vitest },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
      // A focused test silently disables the rest of the suite.
      'vitest/no-focused-tests': 'error',
      'vitest/no-identical-title': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-console': 'error',
      complexity: ['error', 10],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      'max-statements': ['error', 20],
    },
  },
  {
    // The logger is the single sink; every other src module goes through it.
    files: ['src/lib/security/logger.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    // Build and audit scripts are development tooling, not shipped code.
    files: ['scripts/**/*.mjs'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    plugins: { import: importPlugin },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
      },
    },
    rules: {
      // Import cycles are a structural smell in a feature-sliced codebase.
      'import/no-cycle': ['error', { maxDepth: 5 }],
      'import/no-duplicates': 'error',
      'import/no-self-import': 'error',
      // Features are public through their index only, and src/lib stays below
      // every feature. Tests may still reach into a slice when they inspect it.
      'import/no-restricted-paths': ['error', { zones: importZones }],
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
    rules: {
      'vitest/no-focused-tests': 'error',
      'vitest/no-identical-title': 'error',
      'import/no-restricted-paths': 'off',
      complexity: 'off',
      'max-depth': 'off',
      'max-params': 'off',
      'max-statements': 'off',
    },
  },
];

export default config;
