import { expect, test, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * The quality flows.
 *
 * These are the promises the product makes that a unit test cannot prove:
 * the language can be changed with the keyboard alone, the plan survives an
 * offline reload, no API answer is ever cached, the health score moves when
 * the work is done, and the visible budget math adds up.
 */

async function openSamplePlan(page: Page) {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Make room for the moments people will remember.' }),
  ).toBeVisible();

  const sample = page.getByRole('button', { name: /Open a sample plan - A 180-guest wedding/ });
  await expect(sample).toBeVisible();
  await sample.click();

  await expect(page).toHaveURL(/\/plan$/);
  await expect(page.getByRole('heading', { name: /guests/i }).first()).toBeVisible();
}

/** Move the keyboard focus to an element, tab by tab, with no mouse. */
async function focusWithKeyboard(page: Page, target: Locator, maxTabs = 30): Promise<boolean> {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press('Tab');
    const focused = await target
      .evaluate((node) => node === document.activeElement)
      .catch(() => false);
    if (focused) return true;
  }
  return false;
}

/** Read a money cell as a number, ignoring the symbol and separators. */
async function moneyIn(cell: Locator): Promise<number> {
  const text = await cell.innerText();
  return Number.parseFloat(text.replace(/[^\d.-]/g, ''));
}

test.describe('the quality promises', () => {
  test('the language can be changed with the keyboard alone', async ({ page }) => {
    await page.goto('/');

    const select = page.locator('#header-language');
    const reached = await focusWithKeyboard(page, select);
    expect(reached).toBe(true);

    await page.keyboard.press('ArrowDown');
    await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
    await expect(page.getByRole('link', { name: 'आपकी योजना' })).toBeVisible();
  });

  test('the plan is still there after an offline reload', async ({ page, context }) => {
    await openSamplePlan(page);

    // Wait for the service worker to take control of the page.
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: /guests/i }).first()).toBeVisible();

    await context.setOffline(false);
  });

  test('no API answer is kept in the cache', async ({ page }) => {
    await openSamplePlan(page);
    await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));

    const cachedUrls = await page.evaluate(async () => {
      const names = await caches.keys();
      const urls: string[] = [];
      for (const name of names) {
        const cache = await caches.open(name);
        for (const request of await cache.keys()) urls.push(request.url);
      }
      return urls;
    });

    expect(cachedUrls.filter((url) => url.includes('/api/'))).toEqual([]);
  });

  test('completing a milestone moves the health score', async ({ page }) => {
    await openSamplePlan(page);

    const ring = page.getByRole('img', { name: /out of 100/ }).first();
    const before = await ring.getAttribute('aria-label');

    await page.getByRole('tab', { name: /Timeline/ }).click();
    await page.getByRole('checkbox').first().check();

    await page.getByRole('tab', { name: 'Overview' }).click();
    await expect(ring).not.toHaveAttribute('aria-label', before ?? '');
  });

  test('the visible budget adds up to the total', async ({ page }) => {
    await openSamplePlan(page);
    await page.getByRole('tab', { name: 'Budget' }).click();

    const table = page.getByRole('table');
    await expect(table).toBeVisible();

    // The amount is the fifth cell of each row, counting the row heading.
    const rows = table.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    let categories = 0;
    for (let index = 0; index < rowCount; index += 1) {
      categories += await moneyIn(rows.nth(index).locator('td').nth(3));
    }

    const footRows = table.locator('tfoot tr');
    const contingency = await moneyIn(footRows.nth(0).locator('td').nth(3));
    const total = await moneyIn(footRows.nth(1).locator('td').nth(3));

    expect(categories + contingency).toBeCloseTo(total, 1);
  });
});

test.describe('the pages have no accessibility violations', () => {
  const screens = [
    { name: 'the landing page', path: '/' },
    { name: 'the intake form', path: '/intake' },
    { name: 'the plan workspace', path: '/plan' },
  ];

  for (const screen of screens) {
    test(`${screen.name} passes axe`, async ({ page }) => {
      await page.goto(screen.path);
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }

  test('the budget tab passes axe', async ({ page }) => {
    await openSamplePlan(page);
    await page.getByRole('tab', { name: 'Budget' }).click();
    await expect(page.getByRole('heading', { name: 'What if' })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });

  test('the vendors tab passes axe', async ({ page }) => {
    await openSamplePlan(page);
    await page.getByRole('tab', { name: 'Vendors' }).click();
    await expect(page.getByRole('heading', { name: 'Coverage' })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
});
