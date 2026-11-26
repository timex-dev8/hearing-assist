import assert from 'node:assert/strict';
import { test } from 'vitest';
import { onWords, finish, empty } from '../src/capture/transcript';

test('a revised interim and its final result occupy one caption', () => {
  let state = onWords(empty(), 'cell', false, 100);
  state = onWords(state, 'cell division', false, 200);
  state = onWords(state, 'Cell division.', true, 300);
  assert.deepEqual(finish(state), [{ text: 'Cell division.', at: 100 }]);
});

test('stopping after a final and a partial preserves both in order', () => {
  const state = onWords(onWords(empty(), 'Yes.', true, 100), 'Next topic', false, 200);
  assert.deepEqual(finish(state), [{ text: 'Yes.', at: 100 }, { text: 'Next topic', at: 200 }]);
});

test('empty events do not create or erase captions', () => {
  assert.deepEqual(finish(onWords(empty(), ' ', true, 0)), []);
  const state = onWords(empty(), 'Keep this', false, 100);
  assert.deepEqual(finish(onWords(state, '', false, 200)), finish(state));
});
