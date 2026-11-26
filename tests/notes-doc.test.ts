import { test } from 'vitest';
import assert from 'node:assert/strict';
import { blankDoc, docToBlocks, docToHtml, docToText, findTime, notesToDoc } from '../src/notes/doc';
import { blocksToDocx } from '../src/notes/to-docx';
import type { Caption, Notes } from '../src/types';

// Synthetic development fixture.
const captions: Caption[] = [
  { text: 'Today we cover osmosis.', at: 0 },
  { text: 'Osmosis is water moving across a membrane.', at: 61_000 },
  { text: 'Priya will email the slides by Friday.', at: 125_000 },
];
const lecture: Notes = { version: 2, mode: 'Lecture', summary: 'Covered osmosis.', sections: [
  { id: 'summary', heading: 'Summary', kind: 'text', items: [{ text: 'Covered osmosis.', quote: 'Today we cover osmosis.' }] },
  { id: 'terms', heading: 'Key terms', kind: 'term', items: [{ text: 'Osmosis', detail: 'Water moving across a membrane.', quote: 'Osmosis is water moving across a membrane.', marked: true }] },
  { id: 'check', heading: 'Check yourself', kind: 'qa', items: [{ text: 'What is osmosis?', detail: 'Water crossing a membrane.', quote: 'Osmosis is water moving' }] },
] };
const meeting: Notes = { version: 2, mode: 'Meeting', summary: '', sections: [
  { id: 'actions', heading: 'Action items', kind: 'task', items: [{ text: 'Email the slides', detail: 'Priya, by Friday', quote: 'Priya will email the slides by Friday.' }] },
] };

test('a quote is found at the time its caption was spoken', () => {
  assert.equal(findTime('water moving across', captions), 61_000);
  assert.equal(findTime('Priya will email the slides by Friday. And more', captions), 125_000);
  assert.equal(findTime('never said', captions), null);
});

test('lecture notes become a document with headings, terms, questions and timed sources', () => {
  const doc = notesToDoc(lecture, captions);
  assert.equal(doc.type, 'doc');
  const headings = doc.content!.filter(n => n.type === 'heading').map(n => n.content![0].text);
  assert.deepEqual(headings, ['Summary', 'Key terms', 'Check yourself']);
  const sources = JSON.stringify(doc).match(/"type":"source"/g);
  assert.equal(sources?.length, 3);
  const text = docToText(doc);
  assert.match(text, /Osmosis — Water moving across a membrane\./);
  assert.match(text, /What is osmosis\?/);
  assert.match(text, /\[1:01\]/);
  assert.match(JSON.stringify(doc), /"type":"highlight"/, 'a marked item is highlighted');
});

test('action items become an unchecked checklist with the owner kept', () => {
  const doc = notesToDoc(meeting, captions);
  const list = doc.content!.find(n => n.type === 'taskList')!;
  assert.equal(list.content![0].type, 'taskItem');
  assert.equal(list.content![0].attrs!.checked, false);
  assert.match(docToText(doc), /☐ Email the slides — Priya, by Friday/);
});

test('notes saved by the first version (no kinds) still convert', () => {
  const doc = notesToDoc({ summary: 'Old', sections: [{ heading: 'Discussion', items: [{ text: 'Lab is Thursday.', quote: 'Today we cover osmosis.' }] }] }, captions);
  assert.match(docToText(doc), /Discussion\n• Lab is Thursday\./);
});

test('HTML for pasting into Google Docs keeps structure and escapes text', () => {
  const doc = notesToDoc(lecture, captions);
  doc.content!.push({ type: 'paragraph', content: [{ type: 'text', text: '<script>x</script> & ', marks: [{ type: 'bold' }] },
    { type: 'text', text: 'link', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] });
  const html = docToHtml(doc, 'Cell Biology');
  assert.match(html, /<h1>Cell Biology<\/h1>/);
  assert.match(html, /<h2>Key terms<\/h2>/);
  assert.match(html, /<ul><li><p><mark><strong>Osmosis<\/strong><\/mark>/);
  assert.match(html, /<mark>/);
  assert.match(html, /&lt;script&gt;x&lt;\/script&gt; &amp;/);
  assert.doesNotMatch(html, /javascript:/);
});

test('a document flattens into blocks for Word, and Word export produces a .docx file', async () => {
  const doc = notesToDoc(meeting, captions);
  doc.content!.unshift({ type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'Deep' }] });
  doc.content!.push({ type: 'orderedList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'one' }] },
    { type: 'bulletList', content: [{ type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'nested' }] }] }] }] }] });
  const blocks = docToBlocks(doc);
  assert.deepEqual(blocks.map(b => b.kind), ['heading', 'heading', 'task', 'number', 'bullet']);
  assert.equal(blocks.at(-1)!.level, 1, 'nested list items keep their depth');
  const bytes = new Uint8Array(await (await blocksToDocx(blocks, 'Lab meeting')).arrayBuffer());
  assert.equal(String.fromCharCode(bytes[0], bytes[1]), 'PK', 'a .docx is a zip file');
});

test('a blank document has one empty paragraph to type into', () => {
  assert.deepEqual(blankDoc(), { type: 'doc', content: [{ type: 'paragraph' }] });
});
