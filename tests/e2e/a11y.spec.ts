import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { expectNoSidewaysScroll, recordSession, stubApi } from './helpers';

const appearances = [
  { name: 'light', colorScheme: 'light', contrast: 'no-preference' },
  { name: 'dark', colorScheme: 'dark', contrast: 'no-preference' },
  { name: 'light, increased contrast', colorScheme: 'light', contrast: 'more' },
  { name: 'dark, increased contrast', colorScheme: 'dark', contrast: 'more' },
] as const;

/** WCAG 2.2 A and AA, in every appearance. */
async function scan(page: Page, state: string) {
  const problems: string[] = [];
  for (const look of appearances) {
    await page.emulateMedia({ colorScheme: look.colorScheme, contrast: look.contrast });
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    for (const v of violations) problems.push(`${state} (${look.name}): ${v.id}: ${v.help}\n    ${v.nodes.slice(0, 3).map(n => n.target.join(' ') + ' — ' + n.failureSummary?.split('\n')[1]?.trim()).join('\n    ')}`);
  }
  await page.emulateMedia({ colorScheme: 'light', contrast: 'no-preference' });
  return problems;
}

test('every screen and state passes axe in light, dark and increased contrast', async ({ page }) => {
  await stubApi(page);
  await page.emulateMedia({ reducedMotion: 'reduce' }); // scans measure settled colors, not transitions
  const problems: string[] = [];
  await page.goto('/');
  await expect(page.getByText('No Sessions')).toBeVisible();
  problems.push(...await scan(page, 'notebook, empty'));
  await page.goto('/settings');
  problems.push(...await scan(page, 'settings'));
  await page.goto('/settings/captions');
  problems.push(...await scan(page, 'caption style'));
  for (const style of ['High Contrast', 'Classic', 'Default']) {
    await page.getByRole('radio', { name: style }).click();
    problems.push(...await scan(page, 'caption style: ' + style));
  }
  await page.goto('/new');
  problems.push(...await scan(page, 'new session'));

  await page.getByRole('switch', { name: /Everyone agrees/ }).check();
  await page.getByRole('button', { name: 'Start Live Captions' }).click();
  await expect(page.getByLabel('Live captions').getByText('The lab meets Thursday.')).toBeVisible({ timeout: 20_000 });
  problems.push(...await scan(page, 'live, listening'));
  await page.getByRole('button', { name: 'Stop microphone' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Microphone Off' })).toBeVisible();
  problems.push(...await scan(page, 'live, stopped'));
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  problems.push(...await scan(page, 'live, leave sheet'));
  await page.getByRole('dialog').getByRole('button', { name: 'Save Session' }).click();

  await expect(page).toHaveURL(/\/session\//);
  await page.getByRole('radio', { name: 'Transcript' }).click();
  problems.push(...await scan(page, 'detail, transcript'));
  await page.getByRole('button', { name: 'Delete Session' }).click();
  problems.push(...await scan(page, 'detail, delete sheet'));
  await page.keyboard.press('Escape');

  await page.goto('/');
  problems.push(...await scan(page, 'notebook, one session'));

  await recordSession(page, { title: 'Biology' });
  await expect(page.getByText('Lab is on Thursday.')).toBeVisible();
  problems.push(...await scan(page, 'detail, notes'));
  await page.getByRole('radio', { name: 'Ask' }).click();
  problems.push(...await scan(page, 'detail, ask empty'));
  await page.getByLabel('Question about this session').fill('When is the lab?');
  await page.getByRole('button', { name: 'Send question' }).click();
  await expect(page.getByLabel('Questions and answers').getByText('Thursday.', { exact: true })).toBeVisible();
  problems.push(...await scan(page, 'detail, ask answered'));

  expect(problems, problems.join('\n')).toEqual([]);
});

test('the whole flow works with the keyboard alone', async ({ page }) => {
  await stubApi(page);
  async function tabTo(name: RegExp, back = false) {
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press(back ? 'Shift+Tab' : 'Tab');
      const label = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return el ? (el.getAttribute('aria-label') || (el as HTMLInputElement).labels?.[0]?.textContent || el.textContent || '').trim() : '';
      });
      if (name.test(label)) return;
    }
    throw new Error('Could not reach ' + name + ' with Tab');
  }
  await page.goto('/');
  await tabTo(/^New session$/);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/new$/);
  await tabTo(/Session title/);
  await page.keyboard.type('Keyboard class');
  await tabTo(/^Lecture$/);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Meeting' })).toBeFocused();
  await expect(page.getByRole('radio', { name: 'Meeting' })).toHaveAttribute('aria-checked', 'true');
  await tabTo(/Everyone agrees/);
  await page.keyboard.press('Space');
  await tabTo(/Make AI notes/);
  await page.keyboard.press('Space');
  await tabTo(/Start Live Captions/);
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Live captions').getByText('The lab meets Thursday.')).toBeVisible({ timeout: 20_000 });
  await tabTo(/Stop microphone/);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status').filter({ hasText: 'Microphone Off' })).toBeVisible();
  await tabTo(/^Save$/);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/session\//);
  // Focus lands on the new screen's heading so screen readers announce it.
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  await expect(page.getByText('Lab is on Thursday.')).toBeVisible();

  await tabTo(/^Notes$/);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Ask' })).toHaveAttribute('aria-checked', 'true');
  await tabTo(/Question about this session/);
  await page.keyboard.type('When is the lab?');
  await page.keyboard.press('Enter');
  await expect(page.getByLabel('Questions and answers').getByText('Thursday.', { exact: true })).toBeVisible();

  await tabTo(/^Ask$/, true);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('radio', { name: 'Transcript' })).toHaveAttribute('aria-checked', 'true');
  await tabTo(/^Delete Session$/);
  await page.keyboard.press('Enter');
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(sheet.getByRole('button', { name: 'Delete Session' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByText('No Sessions')).toBeVisible();
});

for (const width of [320, 390]) test(`text at 200% reflows at ${width}px with nothing cut off`, async ({ page }) => {
  await stubApi(page);
  await page.setViewportSize({ width, height: 700 });
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = 'html { font-size: 212.5% !important; }'; // twice the 17px body size
      document.head.append(style);
    });
  });
  for (const path of ['/', '/settings', '/settings/captions', '/new']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeAttached();
    await expectNoSidewaysScroll(page);
  }
  await recordSession(page);
  await expectNoSidewaysScroll(page);
  await page.getByRole('radio', { name: 'Ask' }).click();
  await expectNoSidewaysScroll(page);
});

test('screen readers get names, roles and announcements', async ({ page }) => {
  await stubApi(page);
  await page.goto('/new');
  await expect(page).toHaveTitle('New Session – Hearing Assist');
  await expect(page.getByRole('switch', { name: /Everyone agrees/ })).not.toBeChecked();
  await page.getByRole('switch', { name: /Everyone agrees/ }).check();
  await page.getByRole('button', { name: 'Start Live Captions' }).click();
  await expect(page.getByLabel('Live captions').getByText('The lab meets Thursday.')).toBeVisible({ timeout: 20_000 });
  // One polite announcement per finished caption; the typing dots are hidden from assistive tech.
  const live = page.locator('[aria-live="polite"]');
  await expect(live).toHaveText('The lab meets Thursday.');
  for (const dots of await page.locator('.typing').all()) await expect(dots).toHaveAttribute('aria-hidden', 'true');
  await expect(page.getByRole('status').filter({ hasText: 'Listening' })).toBeVisible();
  await expect(page.getByRole('log', { name: 'Live captions' })).toBeVisible();
});
