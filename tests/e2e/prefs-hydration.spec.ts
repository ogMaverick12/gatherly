import { expect, test } from '@playwright/test';

/**
 * Stored preferences must not break hydration.
 *
 * The server does not know what is in localStorage, so the first client render
 * has to match the server's defaults. The stored values are applied afterwards,
 * and the pre-paint theme script keeps the page from flashing the wrong theme.
 */

test('stored preferences hydrate without a mismatch and apply in the document', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.addInitScript(() => {
    localStorage.setItem(
      'gatherly:prefs:v1',
      JSON.stringify({
        language: 'hi',
        theme: 'dark',
        textSize: 'large',
        calmMode: true,
        reducedMotion: true,
      }),
    );
  });

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  expect(errors, errors.join('\n')).toEqual([]);
});
