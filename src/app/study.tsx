import { useState } from 'react';
import { Link } from 'wouter';
import { Page } from './shell';
import { Button, Choice, Icon } from '../components/ui';
import { dueCards, type Card, type Progress } from '../study/cards';
import { modeInfo } from '../notes/modes';

type Deck = 'Due' | 'All';

export function Study({ cards, progress, onGrade }: { cards: Card[]; progress: Progress; onGrade: (id: string, gotIt: boolean) => void }) {
  const pick = (d: Deck) => (d === 'Due' ? dueCards(cards, progress) : cards).map(c => c.id);
  const [deck, setDeck] = useState<Deck>('Due');
  // The round is fixed when it starts: "Got it" removes the card, "Again" moves it to the end.
  const [queue, setQueue] = useState<string[]>(() => pick('Due'));
  const [total, setTotal] = useState(queue.length);
  const [cleared, setCleared] = useState(0);
  const [shown, setShown] = useState(false);
  const card = cards.find(c => c.id === queue[0]);
  const due = dueCards(cards, progress).length;

  function start(next: Deck) {
    const q = pick(next);
    setDeck(next); setQueue(q); setTotal(q.length); setCleared(0); setShown(false);
  }
  function grade(gotIt: boolean) {
    if (!card) return;
    onGrade(card.id, gotIt);
    setQueue(q => gotIt ? q.slice(1) : [...q.slice(1), q[0]]);
    if (gotIt) setCleared(n => n + 1);
    setShown(false);
  }

  if (!cards.length) return <Page title="Study">
    <div className="empty">
      <Icon name="study" size={40} />
      <p className="empty-title">Cards come from your notes</p>
      <p className="empty-detail">Lecture and presentation notes include key terms and “Check yourself” questions. They show up here as flashcards.</p>
      <Button href="/app/notes" kind="secondary">Go to Notes</Button>
    </div>
  </Page>;

  return <Page title="Study" className="study" sub={<p>{cards.length} {cards.length === 1 ? 'card' : 'cards'} · {due} due now</p>}>
    <Choice label="Which cards" variant="segmented" values={['Due', 'All'] as Deck[]} selected={deck} onChange={start}
      names={{ Due: 'Due now', All: 'All cards' }} />
    {card ? <StudyCard key={card.id + ':' + queue.length} card={card} shown={shown} onShow={() => setShown(true)}
      position={cleared + 1} total={total} onGrade={grade} />
      : <div className="empty">
        <Icon name="check" size={40} bold />
        <p className="empty-title">{deck === 'Due' ? 'All caught up' : 'Round finished'}</p>
        <p className="empty-detail">Cards you get right come back in a few days, then a week, so they stick.</p>
        <Button kind="secondary" onClick={() => start('All')}>Study all cards</Button>
      </div>}
  </Page>;
}

function StudyCard({ card, shown, onShow, onGrade, position, total }: {
  card: Card; shown: boolean; onShow: () => void; onGrade: (gotIt: boolean) => void; position: number; total: number;
}) {
  const done = Math.min(position - 1, total);
  return <section className={'flashcard ' + modeInfo[card.mode].css} aria-labelledby="card-front">
    <div className="card-progress">
      <p className="meta card-pos"><span>Card {Math.min(position, total)} of {total}</span><span>{card.kind === 'term' ? 'Key term' : 'Question'}</span></p>
      <div className="bar" role="progressbar" aria-label="Cards reviewed" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <i style={{ transform: `scaleX(${total ? done / total : 0})` }} />
      </div>
    </div>
    <h2 id="card-front" className="card-front">{card.front}</h2>
    {shown ? <div className="card-back settle" aria-live="polite">
      <p className="card-answer">{card.back}</p>
      <blockquote className="quote-chip"><span><span className="visually-hidden">From the transcript: </span>{card.quote}</span></blockquote>
      <Link href={'/app/session/' + card.sessionId} className="text-link" data-navigates>From {card.sessionTitle}</Link>
    </div> : null}
    <div className="card-actions">
      {shown ? <>
        <Button kind="secondary" size="lg" onClick={() => onGrade(false)}>Again</Button>
        <Button size="lg" icon="check" onClick={() => onGrade(true)}>Got it</Button>
      </> : <Button size="lg" onClick={onShow}>{card.kind === 'term' ? 'Show definition' : 'Show answer'}</Button>}
    </div>
  </section>;
}
