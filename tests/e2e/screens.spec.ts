import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { expectNoSidewaysScroll, stubApi } from './helpers';
const session = { id: '1', title: 'Cell Biology', mode: 'Lecture', startedAt: Date.now() - 3600e3, durationMs: 2880000, allowAI: true,
  captions: [{ text: 'The cell needs a way to turn food into energy.', at: 0 }, { text: 'They make ATP, which is basically the cell’s energy currency.', at: 6000 }],
  notes: { summary: 'Mitochondria convert food into ATP.', sections: [{ heading: 'Key concepts', items: [{ text: 'ATP is the cell’s energy currency.', quote: 'They make ATP, which is basically the cell’s energy currency.' }] }, { heading: 'Examples', items: [] }] } };
async function seed(page: Page) {
  await page.goto('/'); await expect(page.getByText('No Sessions')).toBeVisible();
  await page.evaluate(s => new Promise<void>((ok, fail) => { const r = indexedDB.open('hearing-assist'); r.onsuccess = () => { const tx = r.result.transaction('sessions', 'readwrite'); tx.objectStore('sessions').put(s, s.id); tx.oncomplete = () => ok(); tx.onerror = fail; }; }), session);
  await page.reload(); await expect(page.getByText('Cell Biology')).toBeVisible();
}
const looks = [['light', 'light', 'no-preference'], ['dark', 'dark', 'no-preference'], ['contrast', 'light', 'more'], ['dark-contrast', 'dark', 'more']] as const;
const problems: string[] = [];
async function check(page: Page, name: string) {
  for (const [look, colorScheme, contrast] of looks) {
    await page.emulateMedia({ colorScheme, contrast });
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    for (const v of violations) problems.push(`${name} (${look}): ${v.id} ${v.nodes.slice(0, 2).map(n => n.target.join(' ') + ' ' + (n.failureSummary?.split('\n')[1] ?? '')).join(' | ')}`);
    if (process.env.SHOTS && look !== 'dark-contrast') await page.screenshot({ path: `.impeccable/review/r3-${name}-${look}.png` });
  }
  await page.emulateMedia({ colorScheme: 'light', contrast: 'no-preference' });
}
// Uses a saved session, so every screen is checked even where live audio can't run.
test('every screen with a saved session passes axe in four appearances', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await stubApi(page); await seed(page);
  await check(page, 'notebook');
  await page.getByRole('link', { name: 'Settings' }).click(); await check(page, 'settings');
  await page.getByRole('link', { name: /Caption Style/ }).click(); await check(page, 'captions');
  await page.goto('/new'); await page.getByLabel('Session title').fill('Cell Biology'); await page.getByRole('switch', { name: /Everyone/ }).check(); await check(page, 'new');
  await page.getByRole('button', { name: 'Start Live Captions' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Listening' })).toBeVisible({ timeout: 20_000 }); await check(page, 'live');
  await page.getByRole('button', { name: 'Caption style' }).click(); await check(page, 'live-style-sheet'); await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Stop microphone' }).click(); await expect(page.getByRole('status').filter({ hasText: 'Microphone Off' })).toBeVisible(); await check(page, 'live-stopped');
  await page.goto('/session/1'); await expect(page.getByText('ATP is the cell’s energy currency.')).toBeVisible(); await check(page, 'detail-notes');
  await page.getByRole('radio', { name: 'Transcript' }).click(); await check(page, 'detail-transcript');
  await page.getByRole('radio', { name: 'Ask' }).click(); await check(page, 'detail-ask-empty');
  await page.getByRole('button', { name: 'What should I review?' }).click();
  await expect(page.getByLabel('Questions and answers').getByText('Thursday.', { exact: true })).toBeVisible(); await check(page, 'detail-ask');
  expect(problems, problems.join('\n')).toEqual([]);
});
for (const width of [320, 390]) test('200% text reflow at ' + width, async ({ page }) => {
  await stubApi(page); await page.setViewportSize({ width, height: 700 }); await seed(page);
  await page.addStyleTag({ content: 'html{font-size:212.5% !important}' });
  for (const path of ['/', '/settings', '/settings/captions', '/new', '/session/1']) {
    await page.goto(path); await page.addStyleTag({ content: 'html{font-size:212.5% !important}' });
    await expect(page.getByRole('heading', { level: 1 })).toBeAttached(); await expectNoSidewaysScroll(page);
  }
  await page.getByRole('radio', { name: 'Ask' }).click(); await expectNoSidewaysScroll(page);
});
