import { expect, test } from '@playwright/test';
import { ready, stubApi } from './helpers';

test.beforeEach(async ({ page }) => { await stubApi(page); });

test.describe('phone tab bar', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('five places, the current one marked, Record is an ink circle with a microphone', async ({ page }) => {
    await page.goto('/app'); await ready(page);
    const nav = page.locator('.bottom-nav');
    for (const name of ['Home', 'Notes', 'Record', 'Study', 'Settings']) {
      await expect(nav.getByRole('link', { name, exact: true })).toBeVisible();
    }
    await expect(nav.getByRole('link', { name: 'Home', exact: true })).toHaveAttribute('aria-current', 'page');
    const glyph = nav.getByRole('link', { name: 'Record', exact: true }).locator('.nav-glyph');
    await expect(glyph).toHaveCSS('background-color', 'rgb(20, 21, 24)');
    await expect(glyph.locator('svg.icon')).toHaveCount(1);
    await expect(glyph.locator('.record-dot')).toHaveCount(0);
  });

  test('moving between tabs does not animate', async ({ page }) => {
    await page.goto('/app'); await ready(page);
    const notes = page.locator('.bottom-nav').getByRole('link', { name: 'Notes', exact: true });
    await notes.click();
    await expect(notes).toHaveAttribute('aria-current', 'page');
    const running = await notes.evaluate(el => [el, ...el.querySelectorAll('*')].flatMap(n => n.getAnimations()).length);
    expect(running).toBe(0);
  });
});

test('buttons are v4: 48px tall, radius 12, ink fill', async ({ page }) => {
  // On a light page (the Home panel is graphite, where primary is off-white): the empty Notes screen.
  await page.goto('/app/notes'); await ready(page);
  const primary = page.locator('.app-main .btn.primary').first();
  await expect(primary).toHaveCSS('border-top-left-radius', '12px');
  await expect(primary).toHaveCSS('background-color', 'rgb(20, 21, 24)');
  const box = await primary.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(48);
});

test('the logo is an ink square with a white line and a yellow line', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 860 });
  await page.goto('/app'); await ready(page);
  const logo = page.locator('.sidebar .logo-mark');
  await expect(logo.locator('rect[fill="#ffd60a"]')).toHaveCount(1);
  await expect(logo.locator('circle')).toHaveCount(0);
});
