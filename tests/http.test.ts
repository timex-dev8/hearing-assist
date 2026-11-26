import { test, vi } from 'vitest';
import assert from 'node:assert/strict';

vi.mock('../api/_lib/gemini', () => ({
  generate: vi.fn(async () => ({ answer: 'Thursday.', quote: 'The lab is Thursday.' })),
  transcribe: vi.fn(async () => 'Hello class.'),
}));
const { POST: ask } = await import('../api/ask');
const { POST: transcribe } = await import('../api/transcribe');
const { generate } = await import('../api/_lib/gemini');

const post = (body: unknown, headers: Record<string, string> = {}) => new Request('https://hearing.example/api/x', {
  method: 'POST', headers: { 'Content-Type': 'application/json', host: 'hearing.example', ...headers }, body: JSON.stringify(body) });

test('answers from this site and refuses other sites', async () => {
  const body = { transcript: 'The lab is Thursday.', mode: 'Lecture', question: 'When?' };
  const ok = await ask(post(body, { origin: 'https://hearing.example' }));
  assert.equal(ok.status, 200);
  assert.deepEqual(await ok.json(), { answer: 'Thursday.', quote: 'The lab is Thursday.' });
  assert.equal((await ask(post(body, { origin: 'https://unrelated.example' }))).status, 403);
});

test('bad input is a 400 and a model failure is a 503 without leaking details', async () => {
  assert.equal((await ask(post({ transcript: '', mode: 'Lecture', question: 'x' }))).status, 400);
  vi.mocked(generate).mockRejectedValueOnce(new Error('secret upstream detail'));
  const failed = await ask(post({ transcript: 'Text.', mode: 'Lecture', question: 'x' }));
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /secret/);
});

test('transcribe accepts one clip and rejects missing or oversized audio', async () => {
  const ok = await transcribe(post({ audio: 'UklGRg==', context: 'Earlier.' }));
  assert.deepEqual(await ok.json(), { text: 'Hello class.' });
  assert.equal((await transcribe(post({}))).status, 400);
  assert.equal((await transcribe(post({ audio: 'A'.repeat(1_600_000) }))).status, 413);
});
