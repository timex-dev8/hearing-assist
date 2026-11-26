import { expect, test } from '@playwright/test';
import { stubApi } from './helpers';
const out = (n: string) => `.impeccable/review/${process.env.ROUND ?? 'r1'}-${n}.png`;
const looks = [['light', 'light', 'no-preference'], ['dark', 'dark', 'no-preference'], ['contrast', 'light', 'more']] as const;
test.skip(!process.env.SHOTS, 'screenshots only on request');
for (const width of [390, 320, 1280]) test('shots ' + width, async ({ page }) => {
  await stubApi(page);
  await page.setViewportSize({ width, height: width === 1280 ? 800 : 844 });
  const snap = async (name: string, full = false) => {
    for (const [look, scheme, contrast] of looks) {
      if (width !== 390 && look !== 'light') continue;
      await page.emulateMedia({ colorScheme: scheme, contrast, reducedMotion: 'reduce' });
      await page.waitForTimeout(60);
      await page.screenshot({ path: out(`${width}-${name}-${look}`), fullPage: full });
    }
    await page.emulateMedia({ colorScheme: 'light', contrast: 'no-preference' });
  };
  await page.goto('/'); await expect(page.getByText('No Sessions')).toBeVisible(); await snap('notebook-empty');
  await page.goto('/new'); await page.getByLabel('Session title').fill('Cell Biology'); await page.getByRole('switch', { name: /Everyone/ }).check(); await page.getByRole('switch', { name: /AI notes/ }).check(); await snap('new');
  await page.getByRole('button', { name: 'Start Live Captions' }).click();
  await expect(page.getByLabel('Live captions').getByText('Bring your notebook.')).toBeVisible({ timeout: 30_000 });
  await snap('live');
  await page.getByRole('button', { name: 'Stop microphone' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Microphone Off' })).toBeVisible();
  await snap('live-stopped');
  await page.getByRole('button', { name: 'Done' }).click(); await snap('leave-sheet');
  await page.getByRole('dialog').getByRole('button', { name: 'Save Session' }).click();
  await expect(page.getByText('Lab is on Thursday.')).toBeVisible(); await snap('detail-notes', true);
  await page.getByRole('radio', { name: 'Transcript' }).click(); await snap('detail-transcript', true);
  await page.getByRole('radio', { name: 'Ask' }).click(); await page.getByLabel('Question about this session').fill('When is the lab?'); await page.getByRole('button', { name: 'Send question' }).click();
  await expect(page.getByLabel('Questions and answers').getByText('Thursday.', { exact: true })).toBeVisible(); await snap('detail-ask');
  await page.goto('/'); await snap('notebook');
  await page.goto('/settings'); await snap('settings', true);
  await page.goto('/settings/captions'); await snap('captions', true);
  await page.getByRole('radio', { name: 'Classic' }).click(); await page.waitForTimeout(300);
  await page.goto('/new'); await page.getByRole('switch', { name: /Everyone/ }).check(); await page.getByRole('button', { name: 'Start Live Captions' }).click();
  await expect(page.getByLabel('Live captions').getByText('The lab meets Thursday.').first()).toBeVisible({ timeout: 30_000 }); await snap('live-classic');
});
