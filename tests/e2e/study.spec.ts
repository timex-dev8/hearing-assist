import { expect, test } from '@playwright/test';
import { ready, stubApi } from './helpers';
import { seed } from './fixtures';

test.beforeEach(async ({ page }) => { await stubApi(page); });

async function openStudy(page: import('@playwright/test').Page) {
  await seed(page);
  await page.goto('/app/study');
  await ready(page);
}

test('Show answer reveals the answer, the quote and a link back to the session', async ({ page }) => {
  await openStudy(page);
  const card = page.locator('.flashcard');
  await card.getByRole('button', { name: /^Show/ }).click();
  await expect(card.locator('.card-answer')).toBeVisible();
  await expect(card.locator('blockquote.quote-chip')).toContainText('From the transcript');
  await expect(card.getByRole('link', { name: /^From / })).toBeVisible();
  // v4: the card is white with a hairline, not a floating shadow.
  const style = await card.evaluate(el => { const s = getComputedStyle(el); return { radius: s.borderRadius, shadow: s.boxShadow }; });
  expect(style.radius).toBe('16px');
  expect(style.shadow).toMatch(/^rgba\([^)]*\) 0px 0px 0px 1px inset$/); // the hairline ring only, no drop shadow
});

test('Got it moves on to the next card, which slides in from the right', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openStudy(page);
  const pos = page.locator('.card-pos');
  const total = (await pos.textContent())!.match(/of (\d+)/)![1];
  await expect(pos).toContainText(`Card 1 of ${total}`);
  await page.getByRole('button', { name: /^Show/ }).click();
  await page.getByRole('button', { name: 'Got it' }).click();
  await expect(pos).toContainText(`Card 2 of ${total}`);
  const anim = await page.locator('.flashcard').evaluate(el => el.getAnimations().map(a => {
    const t = a.effect!.getComputedTiming();
    const frames = (a.effect as KeyframeEffect).getKeyframes();
    return { duration: Number(t.duration), props: Object.keys(frames[0]).filter(k => !['offset', 'easing', 'composite', 'computedOffset'].includes(k)) };
  }));
  expect(anim.length).toBe(1);
  expect(anim[0].duration).toBeLessThanOrEqual(240);
  expect(anim[0].props.sort()).toEqual(['opacity', 'transform']);
});

test('under Reduce Motion the next card appears in place', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openStudy(page);
  await page.getByRole('button', { name: /^Show/ }).click();
  await page.getByRole('button', { name: 'Got it' }).click();
  await expect(page.locator('.card-pos')).toContainText('Card 2 of');
  const transforms = await page.locator('.flashcard').evaluate(el => el.getAnimations().flatMap(a => (a.effect as KeyframeEffect).getKeyframes().map(f => (f as any).transform)).filter(Boolean));
  expect(transforms).toEqual([]);
});
