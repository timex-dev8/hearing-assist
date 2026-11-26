import { expect, test, type Page } from '@playwright/test';
import { stubApi } from './helpers';
import { seed } from './fixtures';

// Screenshots for design review: SHOTS=1 ROUND=r1 npx playwright test screenshots
const out = (n: string) => `.impeccable/review/${process.env.ROUND ?? 'r1'}-${n}.png`;
test.skip(!process.env.SHOTS, 'screenshots only on request');

/** Full pages are saved in viewport-sized parts so each can be reviewed at full size. */
async function shoot(page: Page, name: string, full: boolean) {
  if (!full) return void await page.screenshot({ path: out(name), scale: 'css' });
  const { width, height } = page.viewportSize()!;
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = Math.round(height * 1.6);
  for (let y = 0, i = 0; y < total; y += step, i++)
    await page.screenshot({ path: out(name + '-' + i), fullPage: true, scale: 'css', clip: { x: 0, y, width, height: Math.min(step, total - y) } });
}
async function snap(page: Page, name: string, full = true, dark = false) {
  await expect(page.locator('.boot')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.waitForTimeout(150);
  await shoot(page, name, full);
  if (dark) {
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
    await page.waitForTimeout(80);
    await shoot(page, name + '-dark', full);
    await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  }
}

for (const width of [390, 1280]) test('shots ' + width, async ({ page }) => {
  await stubApi(page);
  await page.setViewportSize({ width, height: width > 900 ? 860 : 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const w = width > 900 ? 'desk' : 'phone';
  await page.goto('/'); await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await snap(page, w + '-landing');
  await page.goto('/app'); await snap(page, w + '-home-empty', true);
  await seed(page);
  await snap(page, w + '-home', true, true);
  await page.goto('/app/notes'); await snap(page, w + '-library');
  await page.goto('/app/session/1'); await expect(page.getByRole('textbox', { name: /Notes for/ })).toBeVisible(); await snap(page, w + '-session', true, true);
  await page.goto('/app/session/3'); await snap(page, w + '-session-noai');
  await page.goto('/app/new?mode=Seminar'); await snap(page, w + '-new');
  await page.goto('/app/study'); await snap(page, w + '-study');
  await page.getByRole('button', { name: /Show/ }).click(); await snap(page, w + '-study-back');
  await page.goto('/app/settings'); await snap(page, w + '-settings');
  await page.goto('/app/settings/captions'); await snap(page, w + '-captions');
});
