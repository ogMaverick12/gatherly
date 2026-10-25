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
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    // The axe checks render a whole tab and run the full rule set, and under
    // the full suite's parallel load they take longer than the 5 s default.
    // The budget is generous so a slow machine reports a real failure, not a
    // queue.
    testTimeout: 15_000,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
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
          statements: 90,
          branches: 70,
          functions: 90,
          lines: 90,
        },
        'src/features/**/services.ts': {
          statements: 90,
          branches: 70,
          functions: 90,
          lines: 90,
        },
        'src/**': {
          statements: 80,
          branches: 70,
          functions: 80,
          lines: 80,
        },
      },
    },
  },
});
