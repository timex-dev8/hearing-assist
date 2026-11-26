import 'fake-indexeddb/auto';
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { deleteSession, loadSessions, saveNotes, saveSession } from '../src/storage/notebook';
import type { Session } from '../src/types';

const session = (id: string, startedAt: number, extra: Partial<Session> = {}): Session =>
  ({ id, startedAt, title: id, mode: 'Lecture', durationMs: 0, captions: [], allowAI: false, ...extra });

test('a saved session reopens, updates by id, lists newest first, and can be deleted', async () => {
  await saveSession(session('old', 1));
  await saveSession(session('recent', 2));
  await saveSession(session('old', 1, { title: 'Updated' }));
  assert.deepEqual((await loadSessions()).map(s => s.title), ['recent', 'Updated']);
  await deleteSession('recent');
  await deleteSession('old');
  assert.equal((await loadSessions()).length, 0);
});

test('a finished notes job only updates a surviving session that still allows AI', async () => {
  const notes = { summary: 'Saved', sections: [] };
  await saveSession(session('private', 3));
  assert.equal(await saveNotes('private', notes), false);
  assert.equal((await loadSessions())[0].notes, undefined, 'a session without AI consent is left untouched');
  await saveSession(session('chosen', 4, { allowAI: true }));
  assert.equal(await saveNotes('chosen', notes), true);
  assert.equal((await loadSessions()).find(s => s.id === 'chosen')?.notes?.summary, 'Saved');
  await deleteSession('chosen');
  assert.equal(await saveNotes('chosen', notes), false);
  assert.deepEqual((await loadSessions()).map(s => s.id), ['private'], 'a deleted session is not recreated');
  await deleteSession('private');
});

