import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Vite 8 transforms with oxc. The tsconfig keeps `jsx: preserve` because
  // Next.js compiles the app itself, so the automatic runtime is requested
  // here for the test run only.
  oxc: {
    jsx: { runtime: 'automatic' },
  },
  resolve: {
    alias: [
      {
        find: '@tests',
        replacement: fileURLToPath(new URL('./tests', import.meta.url)),
      },
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
  },
  test: {
    environment: 'jsdom',
    // The axe checks render a whole tab and run the full rule set, and under
    // the full suite's parallel load they take longer than the 5 s default.
    // The budget is generous so a slow machine reports a real failure, not a
    // queue.
    testTimeout: 15_000,
    setupFiles: ['./tests/support/setup.ts'],
    include: [
      'tests/app/**/*.test.ts',
      'tests/app/**/*.test.tsx',
      'tests/features/**/*.test.ts',
      'tests/features/**/*.test.tsx',
      'tests/lib/**/*.test.ts',
      'tests/lib/**/*.test.tsx',
      'tests/scripts/**/*.test.ts',
      'tests/scripts/**/*.test.tsx',
    ],
    exclude: ['node_modules/**', '.next/**', 'tests/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/components/ui/**',
        '**/*.config.*',
        '**/types.ts',
      ],
      // The gates are per-area. The services and the shared library carry the
      // logic, so they are held to a higher bar than the whole project.
      thresholds: {
        'src/lib/**': {
          statements: 92,
          branches: 85,
          functions: 92,
          lines: 92,
        },
        'src/features/**/services.ts': {
          statements: 92,
          branches: 85,
          functions: 92,
          lines: 92,
        },
        'src/**': {
          statements: 92,
          branches: 85,
          functions: 92,
          lines: 92,
        },
      },
    },
  },
});
