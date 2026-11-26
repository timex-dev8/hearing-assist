import { expect, test } from '@playwright/test';
import { expectNoSidewaysScroll, stubApi } from './helpers';

test('consent, live captions from audio clips, save, AI notes, ask, reload and delete', async ({ page }) => {
  const uploads = await stubApi(page);
  await page.goto('/');
  await expect(page.getByText('No Sessions')).toBeVisible();
  await page.getByRole('button', { name: 'New session' }).click();
  const start = page.getByRole('button', { name: 'Start Live Captions' });
  await expect(start).toBeDisabled();
  await page.getByLabel('Session title').fill('Lab meeting');
  await page.getByRole('radio', { name: 'Meeting' }).click();
  await page.getByRole('switch', { name: /Everyone agrees/ }).check();
  await page.getByRole('switch', { name: /Make AI notes/ }).check();
  await start.click();
  await expect(page.getByRole('status').filter({ hasText: 'Listening' })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByLabel('Live captions').getByText('The lab meets Thursday.')).toBeVisible({ timeout: 20_000 });
  // Each upload is a standalone 16 kHz WAV clip.
  const wav = Buffer.from(uploads[0].audio, 'base64');
  expect(wav.subarray(0, 4).toString()).toBe('RIFF');
  expect(wav.readUInt32LE(24)).toBe(16000);
  await page.getByRole('button', { name: 'Stop microphone' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Microphone Off' })).toBeVisible();
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(page).toHaveURL(/\/session\//);
  await expect(page.getByRole('heading', { name: 'Lab meeting', level: 1 })).toBeVisible();
  await expect(page.getByText('Lab is on Thursday.')).toBeVisible();
  await expect(page.locator('blockquote').first()).toContainText('The lab meets Thursday.');
  await page.getByRole('radio', { name: 'Ask' }).click();
  await page.getByLabel('Question about this session').fill('When is the lab?');
  await page.getByRole('button', { name: 'Send question' }).click();
  await expect(page.getByLabel('Questions and answers').getByText('Thursday.', { exact: true })).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Notebook' }).click();
  await page.getByRole('link', { name: /Lab meeting/ }).click();
  await expect(page.getByText('Lab is on Thursday.')).toBeVisible();
  await page.getByRole('radio', { name: 'Transcript' }).click();
  await page.getByRole('button', { name: 'Delete Session' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete Session' }).click();
  await expect(page.getByText('No Sessions')).toBeVisible();
});

test('leaving a live session asks before throwing captions away', async ({ page }) => {
  await stubApi(page);
  await page.goto('/new');
  await page.getByRole('switch', { name: /Everyone agrees/ }).check();
  await page.getByRole('button', { name: 'Start Live Captions' }).click();
  await expect(page.getByLabel('Live captions').getByText('The lab meets Thursday.')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Done' }).click();
  const sheet = page.getByRole('dialog', { name: 'Save this session before leaving?' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(page.getByLabel('Live captions').getByText('The lab meets Thursday.')).toBeVisible();
  await page.getByRole('button', { name: 'Done' }).click();
  await sheet.getByRole('button', { name: 'Save Session' }).click();
  await expect(page).toHaveURL(/\/session\//);
});

test('caption style persists and drives live and saved captions', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.getByRole('link', { name: 'Settings' }).click();
  await page.getByRole('link', { name: /Caption Style/ }).click();
  const sample = page.locator('.caption-sample');
  const before = parseFloat(await sample.evaluate(el => getComputedStyle(el).fontSize));
  await page.getByRole('radio', { name: 'Classic' }).click();
  await expect(sample).toHaveCSS('color', 'rgb(255, 214, 10)');
  await page.getByRole('slider', { name: /Text Size/ }).fill('4');
  await expect(page.getByRole('radio', { name: 'Custom' })).toHaveAttribute('aria-checked', 'true');
  await expect.poll(async () => parseFloat(await sample.evaluate(el => getComputedStyle(el).fontSize))).toBeGreaterThan(before * 1.5);
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Custom' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('slider', { name: /Text Size/ })).toHaveAttribute('aria-valuetext', 'Huge');
  await expect(sample).toHaveCSS('color', 'rgb(255, 214, 10)');
  await expectNoSidewaysScroll(page);
});

test('a denied microphone explains how to allow it and stays on the setup screen', async ({ browser }) => {
  const context = await browser.newContext({ permissions: [] });
  const page = await context.newPage();
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await page.goto('/new');
  await page.getByRole('switch', { name: /Everyone agrees/ }).check();
  await page.getByRole('button', { name: 'Start Live Captions' }).click();
  await expect(page.getByRole('alert')).toContainText('Microphone access is off');
  await expect(page.getByRole('button', { name: 'Start Live Captions' })).toBeEnabled();
  await context.close();
});

test('captions stopping on their own are never silent: a message, and one flash if turned on', async ({ page }) => {
  await stubApi(page);
  await page.goto('/settings');
  await page.getByRole('switch', { name: /Flash When Microphone Stops/ }).check();
  await page.waitForTimeout(200);
  await page.goto('/new');
  await page.getByRole('switch', { name: /Everyone agrees/ }).check();
  await page.getByRole('button', { name: 'Start Live Captions' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Listening' })).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByRole('alert')).toContainText('Captions stopped');
  await expect(page.locator('.screen.flash')).toBeAttached();
  await expect(page.locator('.screen.flash')).not.toBeAttached({ timeout: 3000 });
  await expect(page.getByRole('status').filter({ hasText: 'Microphone Off' })).toBeVisible();
});
