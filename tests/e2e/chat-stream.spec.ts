import { expect, test, type Page } from '@playwright/test';

/**
 * The assistant streams.
 *
 * The route is stubbed in the page, with a delay between frames, so the test
 * sees the answer grow instead of appearing in one piece. That is the promise
 * the streaming route makes; if the panel waited for the whole body, the first
 * read below would already contain the last sentence.
 */

async function openSamplePlan(page: Page) {
  await page.goto('/');
  const sample = page.getByRole('button', { name: /Open a sample plan - A 180-guest wedding/ });
  await expect(sample).toBeVisible();
  await sample.click();
  await expect(page).toHaveURL(/\/plan$/);
}

/** Replace fetch for /api/chat with a slow, multi-frame event stream. */
async function stubChatStream(page: Page) {
  await page.addInitScript(() => {
    const original = window.fetch.bind(window);
    const frame = (event: string, data: unknown) =>
      `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    const frames = [
      frame('mode', { provider: 'gemini', live: true }),
      frame('delta', { text: 'Food is ' }),
      frame('delta', { text: '28% ' }),
      frame('delta', { text: 'of the budget.' }),
      frame('done', { mode: 'provider', notices: [], providerError: null }),
    ];

    window.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      if (!url.includes('/api/chat')) return original(input, init);

      const encoder = new TextEncoder();
      const body = new ReadableStream<Uint8Array>({
        async start(controller) {
          for (const chunk of frames) {
            await new Promise((resolve) => setTimeout(resolve, 700));
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        },
      });
      return new Response(body, {
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
      });
    };
  });
}

test.describe('the streaming assistant', () => {
  test('shows the answer growing frame by frame', async ({ page }) => {
    await stubChatStream(page);
    await openSamplePlan(page);
    await page.getByRole('tab', { name: /Assistant/ }).click();

    await page.getByRole('textbox', { name: 'Ask about your plan' }).fill('How much is food?');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect(page.getByRole('button', { name: 'Stop' })).toBeVisible();

    const bubble = page.getByTestId('assistant-stream');
    await expect(bubble).toContainText('Food is');

    const firstRead = await bubble.innerText();
    expect(firstRead).toContain('Food is');
    expect(firstRead).not.toContain('of the budget.');

    await expect(bubble).toContainText('28%');
    const middleRead = await bubble.innerText();
    expect(middleRead.length).toBeGreaterThan(firstRead.length);

    await expect(bubble).toContainText('of the budget.');
    const lastRead = await bubble.innerText();
    expect(lastRead.length).toBeGreaterThan(middleRead.length);

    // The finished answer lands in the conversation, with the mode badge.
    await expect(page.getByText('Food is 28% of the budget.')).toBeVisible();
    await expect(page.getByText('AI assisted').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Stop' })).toHaveCount(0);
  });
});
