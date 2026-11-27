import { test } from 'vitest';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { contrastRatio } from '../src/settings/caption-style';

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
// Only the first :root block that holds the tokens (before any @media override).
const base = css.slice(0, css.indexOf('@media (prefers-contrast'));

function token(name: string, theme: 'light' | 'dark'): string {
  if (name.startsWith('#')) return name;
  const m = base.match(new RegExp(`--${name}:\\s*([^;]+);`));
  assert.ok(m, `--${name} is defined`);
  const value = m[1].trim();
  const pair = value.match(/^light-dark\(\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)$/i);
  if (pair) return theme === 'light' ? pair[1] : pair[2];
  const ref = value.match(/^var\(--([\w-]+)\)$/);
  if (ref) return token(ref[1], theme);
  assert.match(value, /^#[0-9a-f]{6}$/i, `--${name} is a hex color or light-dark() of two`);
  return value;
}

const pairs: [string, string][] = [
  ['ink', 'bg'], ['ink-2', 'bg'], ['ink-3', 'bg'], ['ink-3', 'raised'], ['ink-3', 'surface'],
  ['gt1', 'g0'], ['gt2', 'g0'], ['gt3', 'g0'], ['gt3', 'g1'],
  ['#141518', 'mark'], ['alert', 'raised'], ['alert-on-dark', 'g0'], ['live', 'g0'],
];

for (const theme of ['light', 'dark'] as const) {
  test(`every v4 text role passes 4.5:1 in the ${theme} theme`, () => {
    for (const [fg, bg] of pairs) {
      const ratio = contrastRatio(token(fg, theme), token(bg, theme));
      assert.ok(ratio >= 4.5, `${fg} on ${bg} is ${ratio.toFixed(2)}:1`);
    }
  });
}

test('graphite surfaces stay graphite in both themes (Live is always dark)', () => {
  assert.equal(token('g0', 'light'), '#141518');
  assert.equal(token('g0', 'dark'), '#141518');
  assert.equal(token('mark', 'light'), '#ffd60a');
});

test('the old display face is gone', () => {
  assert.doesNotMatch(css, /Bricolage/);
  assert.doesNotMatch(readFileSync(new URL('../src/styles/base.css', import.meta.url), 'utf8'), /bricolage/i);
});
