import { expect, test, type Page } from '@playwright/test';
import { expectNoSidewaysScroll, ready, scan, stubApi, tabTo } from './helpers';
import { seed } from './fixtures';

// Every screen works from saved sessions, so these checks never depend on this machine's microphone.
test.beforeEach(async ({ page }) => {
  await stubApi(page);
  await page.emulateMedia({ reducedMotion: 'reduce' }); // measure settled colors, not transitions
});

async function open(page: Page, path: string) {
  await page.goto(path);
  await ready(page);
}

test('the landing page passes axe in light, dark and more contrast', async ({ page }) => {
  await open(page, '/');
  const problems = await scan(page, 'landing');
  await page.getByRole('button', { name: 'Classic' }).click();
  await page.locator('.l-faq-list summary').first().click();
  problems.push(...await scan(page, 'landing, classic captions and an open answer'));
  expect(problems, problems.join('\n')).toEqual([]);
});

test('every app screen and sheet passes axe in light, dark and more contrast', async ({ page }) => {
  const problems: string[] = [];
  await open(page, '/app');
  problems.push(...await scan(page, 'home, first run'));
  await open(page, '/app/notes');
  problems.push(...await scan(page, 'notes, empty'));
  await open(page, '/app/study');
  problems.push(...await scan(page, 'study, no cards'));

  await seed(page);
  problems.push(...await scan(page, 'home'));
  await open(page, '/app/notes');
  problems.push(...await scan(page, 'notes'));
  await page.getByLabel('Search notes and transcripts').fill('zebra');
  problems.push(...await scan(page, 'notes, no match'));

  await open(page, '/app/session/1');
  await expect(page.getByRole('textbox', { name: /Notes for/ })).toBeVisible();
  problems.push(...await scan(page, 'session, notes'));
  await page.getByRole('tab', { name: /Transcript/ }).click();
  problems.push(...await scan(page, 'session, transcript'));
  await page.getByRole('tab', { name: 'Ask AI' }).click();
  problems.push(...await scan(page, 'session, ask'));
  await page.getByLabel('Question about this session').fill('What will be on the exam?');
  await page.getByRole('button', { name: 'Ask', exact: true }).click();
  await expect(page.getByRole('log', { name: 'Questions and answers' }).getByText('Thursday.', { exact: true })).toBeVisible();
  problems.push(...await scan(page, 'session, answered'));
  await page.getByRole('button', { name: 'Export' }).click();
  problems.push(...await scan(page, 'session, export sheet'));
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'More actions' }).click();
  problems.push(...await scan(page, 'session, more sheet'));
  await page.getByRole('dialog').getByRole('button', { name: 'Rename' }).click();
  problems.push(...await scan(page, 'session, rename'));
  await page.keyboard.press('Escape');

  await open(page, '/app/session/3');
  problems.push(...await scan(page, 'session without AI'));
  await open(page, '/app/new?mode=Seminar');
  problems.push(...await scan(page, 'new session'));
  await open(page, '/app/study');
  problems.push(...await scan(page, 'study, front'));
  await page.getByRole('button', { name: /Show/ }).click();
  problems.push(...await scan(page, 'study, back'));
  await open(page, '/app/settings');
  problems.push(...await scan(page, 'settings'));
  await open(page, '/app/settings/captions');
  for (const style of ['Default', 'Large Text', 'High Contrast', 'Classic']) {
    await page.getByRole('radio', { name: style }).click();
    problems.push(...await scan(page, 'caption style: ' + style));
  }
  expect(problems, problems.join('\n')).toEqual([]);
});

test('keyboard alone: landing, app, session, export, editor toolbar', async ({ page }) => {
  await seed(page);
  await open(page, '/');
  await tabTo(page, /^Open the app$/);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/app$/);
  await ready(page);
  // Focus lands on the new screen's heading so screen readers announce it.
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();

  await tabTo(page, /^Cell Biology/);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/app\/session\/1$/);
  await expect(page.getByRole('heading', { name: 'Cell Biology', level: 1 })).toBeFocused();

  // Export sheet: focus starts on Cancel, the actions are one Shift+Tab away, Escape closes it.
  await tabTo(page, /^Export$/);
  await page.keyboard.press('Enter');
  const sheet = page.getByRole('dialog', { name: 'Export' });
  await expect(sheet.getByRole('button', { name: 'Cancel' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(sheet).toBeHidden();
  await expect(page.getByRole('button', { name: 'Export' })).toBeFocused();

  // Session view tabs move with the arrow keys.
  await tabTo(page, /^Notes$/);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('tab', { name: /Transcript/ })).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('tab', { name: 'Notes' })).toHaveAttribute('aria-selected', 'true');

  // The editor loads on demand; a cold dev server can take a moment.
  await expect(page.getByRole('toolbar', { name: 'Formatting' })).toBeVisible({ timeout: 15_000 });
  // The toolbar is one Tab stop; arrows move between its buttons.
  await tabTo(page, /^Heading$/);
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('toolbar', { name: 'Formatting' }).getByRole('button', { name: 'Bold' })).toBeFocused();
  await page.keyboard.press('Tab');
  const editor = page.getByRole('textbox', { name: 'Notes for Cell Biology' });
  await expect(editor).toBeFocused();
  await page.keyboard.press('ControlOrMeta+End');
  await page.keyboard.press('Enter');
  await page.keyboard.type('Typed with the keyboard');
  await expect(editor).toContainText('Typed with the keyboard');
  // Edits save on their own: they survive a reload.
  await page.waitForTimeout(800);
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Notes for Cell Biology' })).toContainText('Typed with the keyboard');
});

test('exports: a Word file downloads and the Google Docs copy carries formatting', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await seed(page);
  await open(page, '/app/session/1');
  await expect(page.getByRole('textbox', { name: /Notes for/ })).toBeVisible();

  await page.getByRole('button', { name: 'Export' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('dialog').getByRole('button', { name: /Download Word file/ }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/Cell Biology.*\.docx$/);
  const bytes = await (await import('node:fs/promises')).readFile(await file.path());
  expect(bytes.subarray(0, 2).toString()).toBe('PK'); // a .docx is a zip
  await expect(page.getByRole('status').filter({ hasText: 'Word file downloaded.' })).toBeAttached();

  await page.getByRole('button', { name: 'Export' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /Copy for Google Docs/ }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Notes copied' })).toBeAttached();
  const html = await page.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    return (await item.getType('text/html')).text();
  });
  expect(html).toContain('<h2');
  expect(html).toContain('Key terms');
  expect(html).toMatch(/<strong>Osmosis<\/strong>|<b>Osmosis<\/b>/);
  expect(html).toContain('<ol');
});

test('a source link in the notes jumps to that moment in the transcript', async ({ page }) => {
  await seed(page);
  await open(page, '/app/session/1');
  await page.getByRole('textbox', { name: /Notes for/ }).getByRole('button', { name: /^1:01/ }).first().click();
  await expect(page.getByRole('tab', { name: /Transcript/ })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator(':focus')).toContainText('Osmosis is water moving across a membrane');
});

for (const width of [320, 390]) test(`text at 200% reflows at ${width}px with nothing cut off`, async ({ page }) => {
  await page.setViewportSize({ width, height: 700 });
  await seed(page);
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = 'html { font-size: 200% !important; }';
      document.head.append(style);
    });
  });
  for (const path of ['/', '/app', '/app/notes', '/app/new', '/app/session/1', '/app/session/3', '/app/study', '/app/settings', '/app/settings/captions']) {
    await open(page, path);
    await expectNoSidewaysScroll(page, path);
  }
  await open(page, '/app/session/1');
  for (const tab of [/Transcript/, /Ask AI/]) {
    await page.getByRole('tab', { name: tab }).click();
    await expectNoSidewaysScroll(page, 'session ' + tab);
  }
});

for (const width of [390, 1280]) test(`landing and app lay out at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 860 });
  await seed(page);
  for (const path of ['/', '/app', '/app/notes', '/app/session/1', '/app/study', '/app/settings']) {
    await open(page, path);
    await expectNoSidewaysScroll(page, path);
  }
  // Wide screens get the sidebar; phones get the bottom bar. Exactly one is shown.
  await open(page, '/app');
  const nav = page.getByRole('navigation', { name: /^(Main|App)/ });
  await expect(nav.filter({ visible: true })).toHaveCount(1);
});

test('pages have titles, one h1 and named landmarks', async ({ page }) => {
  await seed(page);
  const expected: [string, RegExp][] = [
    ['/', /Hearing Assist/], ['/app', /^Home · Hearing Assist$/], ['/app/notes', /^Notes · Hearing Assist$/],
    ['/app/session/1', /^Cell Biology · Hearing Assist$/], ['/app/new', /^New session · Hearing Assist$/],
    ['/app/study', /^Study · Hearing Assist$/], ['/app/settings', /^Settings · Hearing Assist$/],
  ];
  for (const [path, title] of expected) {
    await open(page, path);
    await expect(page).toHaveTitle(title);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
  }
});
