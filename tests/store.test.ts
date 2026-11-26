import 'fake-indexeddb/auto';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { createStore, set } from 'idb-keyval';
import { localStore } from '../src/storage/local';
import { defaults } from '../src/settings/caption-style';
import type { Notes, Session } from '../src/types';

const store = localStore();
const session = (id: string, startedAt: number, extra: Partial<Session> = {}): Session =>
  ({ id, startedAt, title: id, mode: 'Lecture', durationMs: 0, captions: [], allowAI: false, ...extra });
const notes: Notes = { summary: 'Saved', sections: [] };
const doc = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'mine' }] }] };

test('a saved session reopens, updates by id, lists newest first, and can be deleted', async () => {
  await store.save(session('old', 1));
  await store.save(session('recent', 2));
  await store.save(session('old', 1, { title: 'Updated' }));
  assert.deepEqual((await store.list()).map(s => s.title), ['recent', 'Updated']);
  await store.remove('recent');
  await store.remove('old');
  assert.equal((await store.list()).length, 0);
});

test('notes only attach to a surviving session that still allows AI, and never overwrite an edited doc unless asked', async () => {
  await store.save(session('private', 3));
  assert.equal(await store.attachNotes('private', notes, doc), undefined);
  await store.save(session('chosen', 4, { allowAI: true }));
  const first = await store.attachNotes('chosen', notes, doc);
  assert.equal(first?.notes?.summary, 'Saved');
  assert.deepEqual(first?.doc, doc);
  await store.save({ ...first!, doc: { type: 'doc', content: [] }, docEditedAt: 5 });
  const kept = await store.attachNotes('chosen', { ...notes, summary: 'Again' }, doc);
  assert.equal(kept?.notes?.summary, 'Again');
  assert.deepEqual(kept?.doc, { type: 'doc', content: [] }, 'an edited doc is kept');
  const replaced = await store.attachNotes('chosen', notes, doc, { replaceDoc: true });
  assert.deepEqual(replaced?.doc, doc);
  await store.remove('chosen');
  assert.equal(await store.attachNotes('chosen', notes, doc), undefined, 'a deleted session is not recreated');
  await store.remove('private');
});

test('preferences save and reload with defaults for new fields, and migrate the first version’s size', async () => {
  await set('size', 34, createStore('hearing-assist-preferences', 'preferences'));
  const migrated = await store.loadPreferences();
  assert.equal(migrated.preset, 'custom');
  assert.equal(migrated.size, 3);
  await store.savePreferences({ ...defaults, preset: 'classic', flash: true });
  const prefs = await store.loadPreferences();
  assert.equal(prefs.preset, 'classic');
  assert.equal(prefs.announce, true);
  assert.equal(prefs.appearance, 'light');
});

test('study progress is kept', async () => {
  assert.deepEqual(await store.loadProgress(), {});
  await store.saveProgress({ x: { box: 1, due: 9 } });
  assert.deepEqual(await store.loadProgress(), { x: { box: 1, due: 9 } });
});
