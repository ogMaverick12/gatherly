import { chromium } from '@playwright/test';

/**
 * Seed the running Chromium with a sample plan, then leave the browser open.
 *
 * This is a separate process on purpose: Playwright's CDP connection must be
 * gone before Lighthouse attaches, otherwise Lighthouse's new page can be
 * closed by the live Playwright connection.
 */

const port = process.env.CDP_PORT;
const base = process.env.BASE_URL;
if (!port || !base) {
  console.error('CDP_PORT and BASE_URL are required.');
  process.exit(1);
}

try {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
  const context = browser.contexts()[0] ?? (await browser.newContext());
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /Open a sample plan - A 180-guest wedding/ }).click();
  await page.waitForURL('**/plan');
  await page
    .getByRole('heading', { name: /guests/i })
    .first()
    .waitFor();

  // Prime the service worker so every measured run starts from the same warm
  // shell instead of paying the install cost in run 1 (or the first two runs).
  await page
    .waitForFunction(() => navigator.serviceWorker?.controller !== null, undefined, {
      timeout: 15_000,
    })
    .catch(() => undefined);
  await page.reload({ waitUntil: 'networkidle' });
  await page
    .getByRole('heading', { name: /guests/i })
    .first()
    .waitFor();

  const stored = await page.evaluate(() => localStorage.getItem('gatherly:plan:v1'));
  if (!stored) throw new Error('The sample plan was not written to local storage.');
  process.exit(0);
} catch (error) {
  console.error(error);
  process.exit(1);
}
