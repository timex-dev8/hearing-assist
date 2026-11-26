import { test } from 'vitest';
import assert from 'node:assert/strict';
import { cardsFrom, dueCards, review } from '../src/study/cards';
import type { Session } from '../src/types';

const DAY = 86_400_000;
const base = { startedAt: 1, durationMs: 0, captions: [], allowAI: true };
const sessions: Session[] = [
  { ...base, id: 'a', title: 'Cell Biology', mode: 'Lecture', notes: { summary: '', sections: [
    { id: 'terms', heading: 'Key terms', kind: 'term', items: [{ text: 'Osmosis', detail: 'Water crossing a membrane.', quote: 'q1' }] },
    { id: 'check', heading: 'Check yourself', kind: 'qa', items: [{ text: 'Why do cells swell?', detail: 'Water flows in.', quote: 'q2' }] },
    { id: 'ideas', heading: 'Main ideas', kind: 'point', items: [{ text: 'Not a card', quote: 'q3' }] },
  ] } },
  { ...base, id: 'b', title: 'Standup', mode: 'Meeting', notes: { summary: '', sections: [
    { id: 'actions', heading: 'Action items', kind: 'task', items: [{ text: 'Not a card', quote: 'q4' }] },
  ] } },
  { ...base, id: 'c', title: 'No notes', mode: 'Lecture' },
];

test('cards come from key terms and check-yourself questions only', () => {
  const cards = cardsFrom(sessions);
  assert.deepEqual(cards.map(c => [c.front, c.back]), [['Osmosis', 'Water crossing a membrane.'], ['Why do cells swell?', 'Water flows in.']]);
  assert.equal(cards[0].kind, 'term');
  assert.equal(cards[0].sessionTitle, 'Cell Biology');
  assert.equal(new Set(cards.map(c => c.id)).size, 2);
  assert.equal(cardsFrom(sessions)[0].id, cards[0].id, 'ids are stable');
});

test('new cards are due now; "got it" spaces them out; "again" brings them back', () => {
  const cards = cardsFrom(sessions);
  const now = 10 * DAY;
  assert.equal(dueCards(cards, {}, now).length, 2);
  let progress = review({}, cards[0].id, true, now);
  assert.equal(dueCards(cards, progress, now).length, 1);
  assert.equal(dueCards(cards, progress, now + DAY).length, 2, 'due again after a day');
  progress = review(progress, cards[0].id, true, now + DAY);
  assert.equal(progress[cards[0].id].due, now + DAY + 3 * DAY);
  progress = review(progress, cards[0].id, false, now + 5 * DAY);
  assert.equal(progress[cards[0].id].box, 0);
  assert.equal(progress[cards[0].id].due, now + 5 * DAY);
});
