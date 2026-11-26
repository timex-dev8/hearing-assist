import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/** Stubs the three API routes. Returns the transcribe request bodies and the notes request bodies. */
export async function stubApi(page: Page) {
  let clip = 0;
  const uploads: any[] = [];
  const noteRequests: any[] = [];
  await page.route('**/api/transcribe', async route => {
    uploads.push(route.request().postDataJSON());
    clip++;
    await route.fulfill({ json: { text: clip % 2 ? 'The lab meets Thursday.' : 'Bring your notebook.' } });
  });
  await page.route('**/api/notes', route => {
    noteRequests.push(route.request().postDataJSON());
    return route.fulfill({ json: {
      version: 2, mode: 'Meeting', summary: 'The lab meeting moved to Thursday.',
      sections: [
        { id: 'summary', heading: 'Summary', kind: 'text', items: [{ text: 'Lab is on Thursday.', quote: 'The lab meets Thursday.' }] },
        { id: 'actions', heading: 'Action items', kind: 'task', items: [{ text: 'Bring your notebook', quote: 'Bring your notebook.' }] },
      ] } });
  });
  await page.route('**/api/ask', route => route.fulfill({ json: { answer: 'Thursday.', quote: 'The lab meets Thursday.' } }));
  return { uploads, noteRequests };
}

/** Waits until the lazy app chunk has replaced the boot message and a screen heading is up. */
export async function ready(page: Page) {
  await expect(page.locator('.boot')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
}

/** Records a short session through the real UI and lands on its session screen. Needs working audio. */
export async function recordSession(page: Page, { ai = true, title = 'Lab meeting' } = {}) {
  await page.goto('/app/new?mode=Meeting');
  await ready(page);
  await page.getByLabel('Session title').fill(title);
  await page.getByRole('switch', { name: /Everyone agrees/ }).check();
  const aiSwitch = page.getByRole('switch', { name: /Write notes with AI/ });
  if (ai) await aiSwitch.check(); else await aiSwitch.uncheck();
  await page.getByRole('button', { name: 'Start live captions' }).click();
  await expect(page.getByRole('log', { name: 'Live captions' }).getByText('The lab meets Thursday.')).toBeVisible({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Stop microphone' }).click();
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page).toHaveURL(/\/app\/session\//);
}

/** Fails if the page scrolls sideways or any control is cut off at the window edge. */
export async function expectNoSidewaysScroll(page: Page, where = '') {
  const report = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const clipped = [...document.querySelectorAll('button, a, input, textarea, [role="radio"], [role="tab"]')]
      .filter(el => {
        const r = el.getBoundingClientRect();
        // Controls inside a deliberate sideways scroller are reachable, not cut off.
        const scroller = el.parentElement?.closest('.tabs');
        return r.width > 0 && !scroller && !el.closest('.visually-hidden, .skip-link, dialog:not([open])') && (r.left < -1 || r.right > width + 1);
      })
      .map(el => (el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 40));
    return { overflow: document.documentElement.scrollWidth - width, clipped };
  });
  expect(report.overflow, where + ' scrolls sideways').toBeLessThanOrEqual(0);
  expect(report.clipped, where + ' has controls cut off at the edge').toEqual([]);
}

export const looks = [
  { name: 'light', theme: 'light', contrast: 'no-preference' },
  { name: 'dark', theme: 'dark', contrast: 'no-preference' },
  { name: 'light, more contrast', theme: 'light', contrast: 'more' },
  { name: 'dark, more contrast', theme: 'dark', contrast: 'more' },
] as const;

/** WCAG 2.2 A and AA in every appearance. The app's own theme switch drives light and dark. */
export async function scan(page: Page, state: string) {
  const problems: string[] = [];
  for (const look of looks) {
    await page.emulateMedia({ contrast: look.contrast });
    await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, look.theme);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    const { violations } = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    for (const v of violations) problems.push(`${state} (${look.name}): ${v.id}: ${v.help}\n    ${v.nodes.slice(0, 3)
      .map(n => n.target.join(' ') + ' — ' + n.failureSummary?.split('\n')[1]?.trim()).join('\n    ')}`);
  }
  await page.emulateMedia({ contrast: 'no-preference' });
  await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
  return problems;
}

/** Presses Tab (or Shift+Tab) until the focused element's name matches. */
export async function tabTo(page: Page, name: RegExp, back = false) {
  const seen: string[] = [];
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press(back ? 'Shift+Tab' : 'Tab');
    const label = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return '';
      return (el.getAttribute('aria-label') || (el as HTMLInputElement).labels?.[0]?.textContent || el.textContent || '').trim();
    });
    if (name.test(label)) return;
    seen.push(label.slice(0, 30));
  }
  throw new Error('Could not reach ' + name + ' with Tab. Focus went: ' + seen.join(' | '));
}
