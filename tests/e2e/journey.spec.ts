import { expect, test, type Page } from '@playwright/test';

/**
 * The end-to-end journey.
 *
 * One pass through the whole product: landing, sample plan, health ring,
 * budget scenario, a milestone completed, a vendor status changed, a CSV
 * export and a share link.
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

test.describe('the Gatherly journey', () => {
  test('landing to a working sample plan', async ({ page }) => {
    await openSamplePlan(page);

    // The health ring is a real, explainable number.
    const ring = page.getByRole('img', { name: /out of 100/ }).first();
    await expect(ring).toBeVisible();

    // The budget shows the visible math and the what-if scenarios.
    await page.getByRole('tab', { name: 'Budget' }).click();
    await expect(page.getByRole('heading', { name: 'What if' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Per guest' })).toBeVisible();

    // A milestone can be completed and the state sticks.
    await page.getByRole('tab', { name: /Timeline/ }).click();
    const milestone = page.getByRole('checkbox').first();
    await milestone.check();
    await expect(milestone).toBeChecked();
    await page.reload();
    await page.getByRole('tab', { name: /Timeline/ }).click();
    await expect(page.getByRole('checkbox').first()).toBeChecked();

    // A vendor status change moves the coverage number.
    await page.getByRole('tab', { name: /Vendors/ }).click();
    const coverage = page.getByRole('heading', { name: 'Coverage' }).locator('xpath=..');
    const before = await coverage.innerText();
    await page.getByLabel('Status').first().selectOption('booked');
    await expect(coverage).not.toHaveText(before);
    await expect(coverage).toContainText('% of the planned vendor budget is booked.');
  });

  test('exports a budget CSV and a share link', async ({ page }) => {
    await openSamplePlan(page);

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export the budget as CSV' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('gatherly-budget.csv');

    await page.getByRole('button', { name: 'Copy a share link' }).click();
    await expect(page.getByText('Share link copied. It never leaves your browser.')).toBeVisible();
  });

  test('the workspace is reachable with the keyboard alone', async ({ page }) => {
    await openSamplePlan(page);

    await page.getByRole('tab', { name: 'Overview' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Budget' })).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.getByRole('tab', { name: /Assistant/ })).toBeFocused();
  });
});
