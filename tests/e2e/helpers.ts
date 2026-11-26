import { expect, type Page } from '@playwright/test';

/** Stubs the three API routes. Returns the transcribe request bodies. */
export async function stubApi(page: Page) {
  let clip = 0;
  const uploads: any[] = [];
  await page.route('**/api/transcribe', async route => {
    uploads.push(route.request().postDataJSON());
    clip++;
    await route.fulfill({ json: { text: clip % 2 ? 'The lab meets Thursday.' : 'Bring your notebook.' } });
  });
  await page.route('**/api/notes', route => route.fulfill({ json: {
    summary: 'The lab meeting moved to Thursday.',
    sections: [{ heading: 'Discussion', items: [{ text: 'Lab is on Thursday.', quote: 'The lab meets Thursday.' }] },
      { heading: 'Decisions', items: [] }, { heading: 'Action items', items: [] }] } }));
  await page.route('**/api/ask', route => route.fulfill({ json: { answer: 'Thursday.', quote: 'The lab meets Thursday.' } }));
  return uploads;
}

/** Records a short session through the real UI and lands on its detail screen. */
export async function recordSession(page: Page, { ai = true, title = 'Lab meeting' } = {}) {
  await page.goto('/new');
  await page.getByLabel('Session title').fill(title);
  await page.getByRole('radio', { name: 'Meeting' }).click();
  await page.getByRole('switch', { name: /Everyone agrees/ }).check();
  if (ai) await page.getByRole('switch', { name: /Make AI notes/ }).check();
  await page.getByRole('button', { name: 'Start Live Captions' }).click();
  await expect(page.getByLabel('Live captions').getByText('The lab meets Thursday.')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Stop microphone' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Microphone Off' })).toBeVisible();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page).toHaveURL(/\/session\//);
}

/** Fails if the page scrolls sideways or any control is cut off at the window edge. */
export async function expectNoSidewaysScroll(page: Page) {
  const report = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const clipped = [...document.querySelectorAll('button, a, input, textarea, [role="radio"]')]
      .filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && !el.closest('.visually-hidden, .skip-link') && (r.left < -1 || r.right > width + 1); })
      .map(el => (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40));
    return { overflow: document.documentElement.scrollWidth - width, clipped };
  });
  expect(report.overflow, 'page scrolls sideways').toBeLessThanOrEqual(0);
  expect(report.clipped, 'controls cut off at the edge').toEqual([]);
}
