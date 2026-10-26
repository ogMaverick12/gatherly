import { defineConfig, devices } from '@playwright/test';

// PORT is ignored unless it is a usable port number: an environment that
// exports PORT=0 would otherwise bind a random port while the readiness probe
// below waited on http://localhost:0, and the whole run would time out.
const requestedPort = Number(process.env.PORT);
const PORT = Number.isInteger(requestedPort) && requestedPort > 0 ? requestedPort : 3210;
// localhost, not 127.0.0.1: the service worker only registers on a secure
// context, and the offline flow is one of the promises these tests check.
const baseURL = `http://localhost:${PORT}`;

/**
 * End-to-end configuration.
 *
 * The journey runs against a production build so it exercises the same
 * bundle a judge would run. `npm run e2e` builds and starts the app, waits
 * for it to answer, and then drives the browser.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    // The share-link button writes to the clipboard, which Chromium only
    // allows for a granted origin.
    permissions: ['clipboard-read', 'clipboard-write'],
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run build && npx next start --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
