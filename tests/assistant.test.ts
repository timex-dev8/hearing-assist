import { test } from 'vitest';
import assert from 'node:assert/strict';
import { assist, splitText } from '../api/_lib/assistant';
import { modes, templates } from '../shared/modes';

// Synthetic development fixture. Never bundled in the app or shown as a real session.
const transcript = 'The lab meets on Thursday. Bring your notebook. Osmosis is water moving across a membrane. Priya will email the slides by Friday.';

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

test('every mode has its own template, ending in something to act on or study', () => {
  assert.deepEqual([...modes], ['Lecture', 'Presentation', 'Meeting', 'Seminar']);
  assert.deepEqual(templates.Lecture.map(s => s.heading), ['Summary', 'Key terms', 'Main ideas', 'Examples', 'Check yourself']);
  assert.deepEqual(templates.Presentation.map(s => s.heading), ['Main message', 'Outline', 'Key takeaways', 'Check yourself', 'Questions to ask']);
  assert.deepEqual(templates.Meeting.map(s => s.heading), ['Summary', 'Decisions', 'Action items', 'Open questions']);
  assert.deepEqual(templates.Seminar.map(s => s.heading), ['Topic', 'Arguments raised', 'Agreements', 'Disagreements', 'Ideas to follow up']);
  for (const mode of modes) assert.equal(new Set(templates[mode].map(s => s.id)).size, templates[mode].length);
});

for (const mode of modes) {
  test(mode + ' notes keep the template order and discard unsupported items', async () => {
    const [first, second] = templates[mode];
    const notes: any = await assist('notes', { transcript, mode }, async (_rules, data: any) => {
      assert.deepEqual(data.sections.map((s: any) => s.id), templates[mode].map(s => s.id));
      return { items: [
        { section: second.id, text: 'Lab is Thursday.', detail: 'Bring a notebook.', quote: 'The lab meets on Thursday.' },
        { section: first.id, text: 'The lab moved.', detail: '', quote: 'The lab meets on Thursday.' },
        { section: first.id, text: 'Meet Friday.', detail: '', quote: 'We meet Friday.' },
        { section: 'made-up', text: 'Nope.', detail: '', quote: 'Bring your notebook.' },
      ] };
    });
    assert.equal(notes.version, 2);
    assert.equal(notes.mode, mode);
    assert.deepEqual(notes.sections.map((s: any) => s.id), [first.id, second.id]);
    assert.equal(notes.sections[0].items.length, 1);
    assert.equal(notes.sections[0].kind, first.kind);
    assert.equal(notes.summary, 'The lab moved.');
  });
}

test('terms and questions need their second half; tasks never gain an owner or date that was not said', async () => {
  const notes: any = await assist('notes', { transcript, mode: 'Lecture' }, async () => ({ items: [
    { section: 'terms', text: 'Osmosis', detail: 'Water moving across a membrane.', quote: 'Osmosis is water moving across a membrane.' },
    { section: 'terms', text: 'Diffusion', detail: '', quote: 'Bring your notebook.' },
    { section: 'check', text: 'What is osmosis?', detail: 'Water crossing a membrane.', quote: 'Osmosis is water moving across a membrane.' },
  ] }));
  const terms = notes.sections.find((s: any) => s.id === 'terms');
  assert.deepEqual(terms.items.map((i: any) => i.text), ['Osmosis']);
  assert.equal(notes.sections.find((s: any) => s.id === 'check').items[0].detail, 'Water crossing a membrane.');

  const meeting: any = await assist('notes', { transcript, mode: 'Meeting' }, async () => ({ items: [
    { section: 'actions', text: 'Email the slides', detail: 'Priya, by Friday', quote: 'Priya will email the slides by Friday.' },
    { section: 'actions', text: 'Book the room', detail: 'Sam, by Monday', quote: 'The lab meets on Thursday.' },
  ] }));
  const actions = meeting.sections.find((s: any) => s.id === 'actions').items;
  assert.equal(actions[0].detail, 'Priya, by Friday');
  assert.equal(actions[1].detail, undefined, 'an owner and date not in the transcript are dropped');
});

test('marked passages are sent to the model and flagged on the notes that cite them', async () => {
  const notes: any = await assist('notes', { transcript, mode: 'Lecture', marks: ['Osmosis is water moving across a membrane.'] },
    async (rules, data: any) => {
      assert.match(rules, /marked/i);
      assert.deepEqual(data.marked, ['Osmosis is water moving across a membrane.']);
      return { items: [
        { section: 'summary', text: 'Covered osmosis.', detail: '', quote: 'Osmosis is water moving across a membrane.' },
        { section: 'ideas', text: 'Lab is Thursday.', detail: '', quote: 'The lab meets on Thursday.' },
      ] };
    });
  assert.equal(notes.sections[0].items[0].marked, true);
  assert.equal(notes.sections[1].items[0].marked, undefined);
});

test('rejects unknown modes and malformed marks before contacting the model', async () => {
  await assert.rejects(assist('notes', { transcript, mode: 'Party' }, async () => assert.fail()), /Lecture/);
  await assert.rejects(assist('notes', { transcript, mode: 'Lecture', marks: 'oops' }, async () => assert.fail()), /marked/i);
});

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
