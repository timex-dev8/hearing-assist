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

test('the hero says who it is for and what it does', async ({ page }) => {
  await page.goto('/'); await ready(page);
  const who = page.getByRole('list', { name: 'Made for people who are' });
  await expect(who.getByRole('listitem')).toHaveText(['Deaf', 'Hard of hearing', 'ADHD']);
  const does = page.getByRole('list', { name: 'What it does' });
  for (const name of ['Record', 'Mark', 'Notes']) await expect(does.getByText(name, { exact: true })).toBeVisible();
  await expect(page.getByText('Live captions and notes from the room you’re in. Read along, mark what matters, study it later.')).toBeVisible();
  await expect(page.getByText('Safari and Chrome. No account, no meeting bot.')).toBeVisible();
});

test('four questions, including accuracy', async ({ page }) => {
  await page.goto('/'); await ready(page);
  await expect(page.locator('.l-faq-list summary')).toHaveCount(4);
  await expect(page.locator('.l-faq-list summary', { hasText: 'How accurate are the captions?' })).toHaveCount(1);
});

test('with Reduce Motion the demo shows its last frame, with no controls, and every section is visible', async ({ page }) => {
  await page.goto('/'); await ready(page);
  await expect(page.getByRole('button', { name: /demo$/ })).toBeHidden();
  await expect(page.locator('.l-note')).toHaveCSS('opacity', '1');
  const opacities = await page.locator('section[data-reveal]').evaluateAll(els => els.map(el => getComputedStyle(el).opacity));
  expect(opacities.length).toBeGreaterThanOrEqual(5);
  expect(opacities.every(o => o === '1')).toBe(true);
});

test.describe('with motion', () => {
  test.beforeEach(async ({ page }) => { await page.emulateMedia({ reducedMotion: 'no-preference' }); });

  test('the demo pauses, plays to the end, then replays from the start', async ({ page }) => {
    await page.goto('/'); await ready(page);
    await page.getByRole('button', { name: 'Pause demo' }).click();
    await expect(page.getByRole('button', { name: 'Play demo' })).toBeVisible();
    const states = await page.locator('.l-demo-run .an').evaluateAll(els => els.map(el => el.getAnimations()[0]?.playState));
    expect(states.every(s => s === 'paused')).toBe(true);
    await page.getByRole('button', { name: 'Play demo' }).click();
    await expect(page.getByRole('button', { name: 'Replay demo' })).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Replay demo' }).click();
    await expect(page.getByRole('button', { name: 'Pause demo' })).toBeVisible();
    const time = await page.locator('.l-demo-run .an').first().evaluate(el => Number(el.getAnimations()[0]?.currentTime ?? 9999));
    expect(time).toBeLessThan(500);
  });

  test('pausing midway and playing again still reaches the end', async ({ page }) => {
    await page.goto('/'); await ready(page);
    await page.waitForTimeout(1500);
    await page.getByRole('button', { name: 'Pause demo' }).click();
    await page.waitForTimeout(2000);
    await page.getByRole('button', { name: 'Play demo' }).click();
    await expect(page.getByRole('button', { name: 'Replay demo' })).toBeVisible({ timeout: 10_000 });
  });

  test('a section below the fold fades in once it scrolls into view', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.goto('/'); await ready(page);
    const faq = page.locator('section[data-reveal="faq"]');
    await expect(faq).toHaveCSS('opacity', '0');
    await faq.scrollIntoViewIfNeeded();
    await expect(faq).toHaveCSS('opacity', '1');
  });
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

test.describe('how it works, in the iPhone frame', () => {
  test('choosing a step shows its screen on the phone', async ({ page }) => {
    await page.goto('/'); await ready(page);
    const step = page.getByRole('button', { name: /Get notes that quote the room/ });
    await step.click();
    await expect(step).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('button', { name: /Start a session/ })).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('.l-phone [data-screen="notes"]')).toBeVisible();
    await expect(page.locator('.l-phone [data-screen="start"]')).toBeHidden();
  });

  test('on a wide screen, scrolling a step to the middle selects it', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 860 });
    await page.goto('/'); await ready(page);
    const step = page.getByRole('button', { name: /Study it later/ });
    await step.evaluate(el => el.scrollIntoView({ block: 'center' }));
    await expect(step).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.l-phone-col')).toHaveCSS('position', 'sticky');
    await expect(page.locator('.l-phone [data-screen="study"]')).toBeVisible();
  });

  test('on a phone the frame scrolls with the page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/'); await ready(page);
    const position = await page.locator('.l-phone-col').evaluate(el => getComputedStyle(el).position);
    expect(position).not.toBe('sticky');
    const island = await page.locator('.l-phone').evaluate(el => getComputedStyle(el, '::after').content);
    expect(island).not.toBe('none');
  });
});
