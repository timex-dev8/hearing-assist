import { expect, test } from '@playwright/test';
import { ready } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('the hero names who it is for', async ({ page }) => {
  await page.goto('/'); await ready(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Every word, on your screen.');
  for (const who of ['Deaf', 'Hard of hearing', 'ADHD']) {
    await expect(page.getByRole('heading', { level: 3, name: who, exact: true })).toBeVisible();
  }
});

test('the footer credits Icons8', async ({ page }) => {
  await page.goto('/'); await ready(page);
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'Icons8' })).toHaveAttribute('href', 'https://icons8.com');
});

test('caption style buttons switch the example', async ({ page }) => {
  await page.goto('/'); await ready(page);
  const group = page.getByRole('group', { name: 'Caption style' });
  await expect(group.getByRole('button', { name: 'Default' })).toHaveAttribute('aria-pressed', 'true');
  await group.getByRole('button', { name: 'Classic' }).click();
  await expect(group.getByRole('button', { name: 'Classic' })).toHaveAttribute('aria-pressed', 'true');
  await expect(group.getByRole('button', { name: 'Default' })).toHaveAttribute('aria-pressed', 'false');
});

test.describe('phone navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('section links live behind a Menu button', async ({ page }) => {
    await page.goto('/'); await ready(page);
    const menu = page.getByRole('button', { name: 'Menu' });
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('navigation', { name: 'Sections' })).toBeHidden();

    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    const panel = page.getByRole('navigation', { name: 'Menu' });
    await expect(panel.getByRole('link', { name: 'Accessibility' })).toBeVisible();
    await expect(panel.getByRole('link', { name: 'Open the app' })).toBeVisible();
  });

  test('Escape closes the menu and returns focus to the button', async ({ page }) => {
    await page.goto('/'); await ready(page);
    const menu = page.getByRole('button', { name: 'Menu' });
    await menu.click();
    await page.keyboard.press('Escape');
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByRole('navigation', { name: 'Menu' })).toHaveCount(0);
    await expect(menu).toBeFocused();
  });

  test('choosing a section closes the menu', async ({ page }) => {
    await page.goto('/'); await ready(page);
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('navigation', { name: 'Menu' }).getByRole('link', { name: 'Privacy' }).click();
    await expect(page.getByRole('navigation', { name: 'Menu' })).toHaveCount(0);
    await expect(page).toHaveURL(/#privacy$/);
  });

  test('the bar stays on one line at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/'); await ready(page);
    const bar = await page.getByRole('banner').boundingBox();
    expect(bar!.height).toBeLessThanOrEqual(60);
  });
});

test.describe('wide navigation', () => {
  test.use({ viewport: { width: 1280, height: 860 } });

  test('section links show and there is no Menu button', async ({ page }) => {
    await page.goto('/'); await ready(page);
    await expect(page.getByRole('navigation', { name: 'Sections' }).getByRole('link', { name: 'Privacy' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden();
  });
});
