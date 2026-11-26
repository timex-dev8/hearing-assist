import type { Mode, Session } from '../types';

export type Card = { id: string; sessionId: string; sessionTitle: string; mode: Mode; kind: 'term' | 'qa'; front: string; back: string; quote: string };
export type Progress = Record<string, { box: number; due: number }>;

const DAY = 86_400_000;
const intervals = [1, 3, 7, 16, 35]; // days after each correct answer in a row

function hash(text: string) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(36);
}

/** Study cards are the key terms and check-yourself questions of every session's notes. */
export function cardsFrom(sessions: Session[]): Card[] {
  return sessions.flatMap(session => (session.notes?.sections ?? []).flatMap(section =>
    section.kind === 'term' || section.kind === 'qa' ? section.items.filter(i => i.detail).map(item => ({
      id: session.id + ':' + hash(section.kind + item.text), sessionId: session.id, sessionTitle: session.title, mode: session.mode,
      kind: section.kind as 'term' | 'qa', front: item.text, back: item.detail!, quote: item.quote,
    })) : []));
}

export const dueCards = (cards: Card[], progress: Progress, now = Date.now()) =>
  cards.filter(card => (progress[card.id]?.due ?? 0) <= now);

export function review(progress: Progress, id: string, gotIt: boolean, now = Date.now()): Progress {
  const box = gotIt ? (progress[id] ? progress[id].box + 1 : 1) : 0;
  const days = gotIt ? intervals[Math.min(box, intervals.length) - 1] : 0;
  return { ...progress, [id]: { box, due: now + days * DAY } };
}
