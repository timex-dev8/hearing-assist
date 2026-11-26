import { test } from 'vitest';
import assert from 'node:assert/strict';
import { assist, headings, splitText } from '../api/_lib/assistant';

// Synthetic development fixture. Never bundled in the app or shown as a real session.
const transcript = 'The lab meets on Thursday. Bring your notebook.';
test('rejects an invented source quote and abstains when the transcript cannot answer', async () => {
  const answer = await assist('ask', { transcript, mode: 'Lecture', question: 'Who leads?' },
    async () => ({ answer: 'Alex.', quote: 'Alex leads the lab.' }));
  assert.equal(answer.quote, null);
  assert.match(answer.answer, /transcript/i);
});
test('returns a grounded answer with its exact source', async () => {
  const answer = await assist('ask', { transcript, mode: 'Meeting', question: 'When?' },
    async () => ({ answer: 'Thursday.', quote: 'The lab meets on Thursday.' }));
  assert.equal(answer.quote, 'The lab meets on Thursday.');
});
for (const mode of ['Lecture', 'Meeting'] as const) {
  test(mode + ' notes use mode-specific headings and discard unsupported facts', async () => {
    const notes: any = await assist('notes', { transcript, mode }, async () => ({
      items: [
        { section: headings[mode][0], text: 'The lab meets Thursday.', quote: 'The lab meets on Thursday.' },
        { section: headings[mode][1], text: 'Meet Friday.', quote: 'Friday.' },
      ],
    }));
    assert.deepEqual(notes.sections.map((s: any) => s.heading), headings[mode]);
    assert.equal(notes.sections[1].items.length, 0);
    assert.equal(notes.summary, 'The lab meets Thursday.');
  });
}
test('chunks keep the end of long input and split very long utterances', () => {
  const source = 'A'.repeat(17000) + ' LAST';
  const parts = splitText(source);
  assert.ok(parts.length > 1);
  assert.ok(parts.every(part => part.length <= 6000));
  assert.match(parts.at(-1)!, /LAST/);
});
test('a later correction is considered before answering across chunks', async () => {
  const old = 'Our first plan was Tuesday.';
  const change = 'Correction, the meeting is Friday.';
  const long = old + '\n' + 'Background. '.repeat(560) + '\n' + change;
  const result = await assist('ask', { transcript: long, mode: 'Meeting', question: 'When is the meeting?' },
    async (_rules: string, data: any) => {
      if (data.evidence) {
        assert.deepEqual(data.evidence.map((e: any) => e.quote), [old, change]);
        return { answer: 'Friday.', quote: change };
      }
      return data.transcript.includes(change) ? { answer: 'Friday.', quote: change } : { answer: 'Tuesday.', quote: old };
    });
  assert.equal(result.quote, change);
});
test('rejects empty transcripts before contacting the model', async () => {
  await assert.rejects(assist('notes', { transcript: ' ', mode: 'Lecture' }, async () => assert.fail()), /transcript/i);
});
