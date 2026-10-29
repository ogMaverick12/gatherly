import { expect, test, type Page } from '@playwright/test';

/**
 * Content Security Policy smoke tests.
 *
 * Every document route must load with the nonce-based policy the middleware
 * issues. A missing nonce shows up as a console error or a page error, so the
 * test listens for both rather than inspecting headers alone.
 */

/** Collect the browser errors that would indicate a CSP or hydration failure. */
function collectErrors(page: Page, ignore: (text: string) => boolean = () => false): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !ignore(message.text())) errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

/** Fail with the actual messages, which are more useful than a bare length check. */
function expectNoErrors(errors: string[]): void {
  expect(errors, errors.join('\n')).toEqual([]);
  expect(errors.join('\n')).not.toContain('Content Security Policy');
}

test.describe('the content security policy', () => {
  for (const path of ['/', '/intake', '/plan', '/does-not-exist']) {
    test(`${path} loads without console errors`, async ({ page }) => {
      // The unknown path is a real 404, and Chromium logs that status as a
      // console error. Every other message, including CSP violations, fails.
      const errors = collectErrors(page, (text) =>
        path === '/does-not-exist' ? text.includes('status of 404') : false,
      );

      await page.goto(path);
      await page.waitForLoadState('networkidle');

      expectNoErrors(errors);
    });
  }
});
