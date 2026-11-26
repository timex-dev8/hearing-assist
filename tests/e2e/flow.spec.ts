import { expect, test } from '@playwright/test';
import { expectNoSidewaysScroll, ready, scan, stubApi } from './helpers';

// These run the real capture pipeline on Chrome's fake microphone, so they need working audio on this machine.

test('consent, live captions from audio clips, a mark, save, AI notes doc, ask, reload and delete', async ({ page }) => {
  const { uploads, noteRequests } = await stubApi(page);
  await page.goto('/app');
  await ready(page);
  await page.getByRole('link', { name: 'Start meeting' }).or(page.getByRole('link', { name: 'Start lecture' })).first().click();
  await ready(page);
  const start = page.getByRole('button', { name: 'Start live captions' });
  await expect(start).toBeDisabled();
  await page.getByLabel('Session title').fill('Lab meeting');
  await page.getByRole('radio', { name: /Meeting/ }).click();
  await page.getByRole('switch', { name: /Everyone agrees/ }).check();
  await expect(page.getByRole('switch', { name: /Write notes with AI/ })).toBeChecked();
  await start.click();

  const log = page.getByRole('log', { name: 'Live captions' });
  await expect(log.getByText('The lab meets Thursday.')).toBeVisible({ timeout: 20_000 });
  // Each upload is a standalone 16 kHz WAV clip.
  const wav = Buffer.from(uploads[0].audio, 'base64');
  expect(wav.subarray(0, 4).toString()).toBe('RIFF');
  expect(wav.readUInt32LE(24)).toBe(16000);
  // The rest of the app steps out of the way while captions run.
  await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();

  await page.getByRole('button', { name: /^Mark this moment/ }).click();
  await expect(page.getByRole('button', { name: /1 marked/ })).toBeVisible();
  await page.getByRole('button', { name: 'Stop microphone' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(page).toHaveURL(/\/app\/session\//);
  await expect(page.getByRole('heading', { name: 'Lab meeting', level: 1 })).toBeVisible();
  const editor = page.getByRole('textbox', { name: 'Notes for Lab meeting' });
  await expect(editor).toContainText('Lab is on Thursday.', { timeout: 15_000 });
  await expect(editor.getByRole('heading', { name: 'Action items' })).toBeVisible();
  // The marked passage went to the AI with the transcript.
  expect(noteRequests[0].mode).toBe('Meeting');
  expect(noteRequests[0].marks.length).toBeGreaterThan(0);

  await page.getByRole('tab', { name: 'Ask AI' }).click();
  await page.getByLabel('Question about this session').fill('When is the lab?');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await expect(page.getByRole('log', { name: 'Questions and answers' }).getByText('Thursday.', { exact: true })).toBeVisible();

  await page.reload();
  await ready(page);
  await page.getByRole('link', { name: 'Notes', exact: true }).first().click();
  await page.getByRole('link', { name: /Lab meeting/ }).click();
  await expect(page.getByRole('textbox', { name: 'Notes for Lab meeting' })).toContainText('Lab is on Thursday.');
  await page.getByRole('button', { name: 'More actions' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete session' }).click();
  await page.getByRole('dialog', { name: 'Delete this session?' }).getByRole('button', { name: 'Delete session' }).click();
  await expect(page).toHaveURL(/\/app\/notes$/);
  await expect(page.getByText('No sessions yet')).toBeVisible();
});

test('the live screen passes axe while listening, stopped and leaving', async ({ page }) => {
  await stubApi(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/app/new?mode=Lecture');
  await ready(page);
  await page.getByRole('switch', { name: /Everyone agrees/ }).check();
  await page.getByRole('button', { name: 'Start live captions' }).click();
  await expect(page.getByRole('log', { name: 'Live captions' }).getByText('The lab meets Thursday.')).toBeVisible({ timeout: 20_000 });
  const problems = await scan(page, 'live, listening');
  await page.getByRole('button', { name: 'Caption style' }).click();
  problems.push(...await scan(page, 'live, style sheet'));
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Stop microphone' }).click();
  await expect(page.getByRole('button', { name: 'Resume captions' })).toBeVisible();
  problems.push(...await scan(page, 'live, stopped'));
  await expectNoSidewaysScroll(page, 'live');
  await page.getByRole('button', { name: 'Done' }).click();
  problems.push(...await scan(page, 'live, leave sheet'));
  expect(problems, problems.join('\n')).toEqual([]);
});

test('leaving a live session asks before throwing captions away', async ({ page }) => {
  await stubApi(page);
  await page.goto('/app/new');
  await ready(page);
  await page.getByRole('switch', { name: /Everyone agrees/ }).check();
  await page.getByRole('button', { name: 'Start live captions' }).click();
  await expect(page.getByRole('log', { name: 'Live captions' }).getByText('The lab meets Thursday.')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Done' }).click();
  const sheet = page.getByRole('dialog', { name: 'Save this session before leaving?' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(page.getByRole('log', { name: 'Live captions' }).getByText('The lab meets Thursday.')).toBeVisible();
  await page.getByRole('button', { name: 'Done' }).click();
  await sheet.getByRole('button', { name: 'Save session' }).click();
  await expect(page).toHaveURL(/\/app\/session\//);
});

test('screen readers get one announcement per finished caption', async ({ page }) => {
  await stubApi(page);
  await page.goto('/app/new');
  await ready(page);
  await page.getByRole('switch', { name: /Everyone agrees/ }).check();
  await page.getByRole('button', { name: 'Start live captions' }).click();
  await expect(page.getByRole('log', { name: 'Live captions' }).getByText('The lab meets Thursday.')).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('[aria-live="polite"]').filter({ hasText: 'The lab meets Thursday.' })).toHaveCount(1);
  for (const dots of await page.locator('.typing').all()) await expect(dots).toHaveAttribute('aria-hidden', 'true');
});

test('a denied microphone explains how to allow it and stays on the setup screen', async ({ browser }) => {
  const context = await browser.newContext({ permissions: [] });
  const page = await context.newPage();
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () => Promise.reject(new DOMException('denied', 'NotAllowedError'));
  });
  await page.goto('/app/new');
  await ready(page);
  await page.getByRole('switch', { name: /Everyone agrees/ }).check();
  await page.getByRole('button', { name: 'Start live captions' }).click();
  await expect(page.getByRole('alert')).toContainText('Microphone access is off');
  await expect(page.getByRole('button', { name: 'Start live captions' })).toBeEnabled();
  await context.close();
});

test('captions stopping on their own are never silent: a message, and one flash if turned on', async ({ page }) => {
  await stubApi(page);
  await page.goto('/app/settings');
  await ready(page);
  await page.getByRole('switch', { name: /Flash when the microphone stops/ }).check();
  await page.waitForTimeout(200);
  await page.goto('/app/new');
  await ready(page);
  await page.getByRole('switch', { name: /Everyone agrees/ }).check();
  await page.getByRole('button', { name: 'Start live captions' }).click();
  await expect(page.getByRole('log', { name: 'Live captions' }).getByText('The lab meets Thursday.')).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByRole('alert')).toContainText('Captions stopped');
  await expect(page.locator('.live.flash')).toBeAttached();
  await expect(page.locator('.live.flash')).not.toBeAttached({ timeout: 3000 });
  await expect(page.getByRole('button', { name: 'Resume captions' })).toBeVisible();
});

test('caption style persists and drives the preview', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/app/settings');
  await ready(page);
  await page.getByRole('link', { name: /Caption style/ }).click();
  const sample = page.locator('.caption-sample');
  const before = parseFloat(await sample.evaluate(el => getComputedStyle(el).fontSize));
  await page.getByRole('radio', { name: 'Classic' }).click();
  await expect(sample).toHaveCSS('color', 'rgb(255, 214, 10)');
  await page.getByRole('slider', { name: /Text size/ }).fill('4');
  await expect(page.getByRole('radio', { name: 'Custom' })).toHaveAttribute('aria-checked', 'true');
  await expect.poll(async () => parseFloat(await sample.evaluate(el => getComputedStyle(el).fontSize))).toBeGreaterThan(before * 1.5);
  await page.reload();
  await ready(page);
  await expect(page.getByRole('radio', { name: 'Custom' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('slider', { name: /Text size/ })).toHaveAttribute('aria-valuetext', 'Huge');
  await expect(sample).toHaveCSS('color', 'rgb(255, 214, 10)');
  await expectNoSidewaysScroll(page);
});

test('appearance setting switches the whole app to dark and back', async ({ page }) => {
  await page.goto('/app/settings');
  await ready(page);
  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.waitForTimeout(300); // let the IndexedDB write finish before reloading
  await page.reload();
  await ready(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('radio', { name: 'Light' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
