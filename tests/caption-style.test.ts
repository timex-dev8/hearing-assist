import { test } from 'vitest';
import assert from 'node:assert/strict';
import { captionVars, contrastRatio, defaults, presets, resolveCaption, sizeSteps, type Preferences } from '../src/settings/caption-style';

test('the Default preset matches the old Large caption size and follows the system colors', () => {
  const style = resolveCaption(defaults);
  assert.equal(style.font, 'system');
  assert.equal(style.size, sizeSteps[1]);
  assert.equal(style.colors, 'auto');
});

test('named presets override the custom fields; Custom uses them', () => {
  const custom: Preferences = { ...defaults, font: 'hyperlegible', size: 4, spacing: 'roomy', colors: 'yellow-on-black' };
  assert.deepEqual(resolveCaption({ ...custom, preset: 'contrast' }), presets.contrast);
  assert.deepEqual(resolveCaption({ ...custom, preset: 'custom' }),
    { font: 'hyperlegible', size: sizeSteps[4], spacing: 'roomy', colors: 'yellow-on-black' });
});

test('out-of-range sizes are clamped instead of breaking the layout', () => {
  assert.equal(resolveCaption({ ...defaults, preset: 'custom', size: 99 }).size, sizeSteps.at(-1));
  assert.equal(resolveCaption({ ...defaults, preset: 'custom', size: -3 }).size, sizeSteps[0]);
});

test('every fixed caption color pair is at least 7:1 (WCAG AAA)', () => {
  for (const colors of ['white-on-black', 'black-on-white', 'yellow-on-black'] as const) {
    const vars = captionVars({ font: 'system', size: 1.5, spacing: 'normal', colors });
    assert.ok(contrastRatio(vars['--cap-fg'], vars['--cap-bg']) >= 7, colors);
  }
});

test('CSS variables use rem so captions follow the phone text size; auto colors are graphite, like the Live screen', () => {
  const vars = captionVars(presets.default);
  assert.match(vars['--cap-size'], /rem$/);
  assert.equal(vars['--cap-fg'], 'var(--gt1)');
  assert.equal(vars['--cap-bg'], 'var(--g0)');
  assert.equal(captionVars(presets.large)['--cap-fg'], 'var(--gt1)');
  assert.deepEqual([captionVars(presets.contrast)['--cap-fg'], captionVars(presets.contrast)['--cap-bg']], ['#ffffff', '#000000']);
  assert.deepEqual([captionVars(presets.classic)['--cap-fg'], captionVars(presets.classic)['--cap-bg']], ['#ffd60a', '#000000']);
  assert.equal(captionVars({ ...presets.default, spacing: 'roomy' })['--cap-leading'], '1.65');
  assert.match(captionVars({ ...presets.default, font: 'hyperlegible' })['--cap-font'], /Atkinson Hyperlegible/);
});

test('contrast ratio matches the WCAG formula', () => {
  assert.equal(Math.round(contrastRatio('#000000', '#ffffff')), 21);
  assert.equal(contrastRatio('#777777', '#777777'), 1);
});
