import 'fake-indexeddb/auto';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { set, createStore } from 'idb-keyval';
import { loadPreferences, savePreferences } from '../src/storage/notebook';
import { defaults } from '../src/settings/caption-style';

const legacy = createStore('hearing-assist-preferences', 'preferences');

test('a caption size saved by the first version becomes the matching Custom size', async () => {
  await set('size', 34, legacy);
  const prefs = await loadPreferences();
  assert.equal(prefs.preset, 'custom');
  assert.equal(prefs.size, 3);
});

test('preferences save and reload, and new fields get defaults', async () => {
  await savePreferences({ ...defaults, preset: 'classic', flash: true });
  const prefs = await loadPreferences();
  assert.equal(prefs.preset, 'classic');
  assert.equal(prefs.flash, true);
  assert.equal(prefs.announce, true);
});
