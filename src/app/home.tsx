import { useState } from 'react';
import { Link } from 'wouter';
import { Page } from './shell';
import { Button, Choice, Icon } from '../components/ui';
import { modeClasses, modeIcons, modeInfo, modes, type Mode } from '../notes/modes';
import { SessionRow, excerpt, ModeBadge } from './session-row';
import { formatTime, shortWhen } from '../util/time';
import type { Session } from '../types';

function greeting(hour = new Date().getHours()) {
  return hour < 5 ? 'Up late' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
}

export function Home({ sessions, due, cards }: { sessions: Session[]; due: number; cards: number }) {
  const [mode, setMode] = useState<Mode>(sessions[0]?.mode ?? 'Lecture');
  const latest = sessions[0];
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
  return <Page title={greeting()} docTitle="Home" className="home" sub={<p>{today}</p>}>
    <div className="home-grid">
      <section className="start-card" aria-labelledby="start-h">
        <span className="aura" aria-hidden="true"><i /><i /></span>
        <div className="start-inner">
          <h2 id="start-h" className="start-title">Start live captions</h2>
          <p className="start-lead" id="start-mode-h">What are you listening to? Your notes are shaped to fit.</p>
          <Choice values={modes} selected={mode} onChange={setMode} labelledBy="start-mode-h" icons={modeIcons} classes={modeClasses} />
          <p className="start-gets">{modeInfo[mode].gets}.</p>
          <Button href={'/app/new?mode=' + mode} size="lg" icon="mic">Start {mode.toLowerCase()}</Button>
        </div>
      </section>

      {latest && <section className="home-block" aria-labelledby="continue-h">
        <h2 id="continue-h" className="block-title">Pick up where you left off</h2>
        <Link href={'/app/session/' + latest.id} className={'continue-card ' + modeInfo[latest.mode].css} data-navigates>
          <span className="continue-top"><ModeBadge mode={latest.mode} /><span className="meta">{shortWhen(latest.startedAt)} · <span className="tabular">{formatTime(latest.durationMs)}</span></span></span>
          <span className="continue-title">{latest.title}</span>
          {excerpt(latest) && <span className="continue-quote">{excerpt(latest)}</span>}
          <span className="continue-go">{latest.doc ? 'Open notes' : 'Open transcript'}<Icon name="chevron" size={18} /></span>
        </Link>
      </section>}

      {cards > 0 && <section className="home-block" aria-labelledby="review-h">
        <h2 id="review-h" className="block-title">Review</h2>
        <Link href="/app/study" className="review-card" data-navigates>
          <span className="review-glyph" aria-hidden="true"><Icon name="study" size={26} fill /></span>
          <span className="review-text">
            <span className="review-count">{due ? due + (due === 1 ? ' card is' : ' cards are') + ' ready' : 'You’re all caught up'}</span>
            <span className="meta">{due ? 'Key terms and questions from your notes.' : cards + (cards === 1 ? ' card' : ' cards') + ' in your deck. Come back tomorrow.'}</span>
          </span>
          <Icon name="chevron" size={18} />
        </Link>
      </section>}

      {sessions.length ? <section className="home-block recent" aria-labelledby="recent-h">
        <div className="block-head"><h2 id="recent-h" className="block-title">Recent</h2>
          {sessions.length > 4 && <Link href="/app/notes" className="text-link" data-navigates>See all {sessions.length}</Link>}</div>
        <ul className="session-list">{sessions.slice(0, 4).map(s => <li key={s.id}><SessionRow session={s} /></li>)}</ul>
      </section> : <section className="home-block first-run" aria-labelledby="how-h">
        <h2 id="how-h" className="block-title">How it works</h2>
        <ol className="steps">
          <li><span className="step-n" aria-hidden="true">1</span><span><strong>Pick a mode and start.</strong> Check that everyone agrees to being transcribed.</span></li>
          <li><span className="step-n" aria-hidden="true">2</span><span><strong>Read along.</strong> Captions appear a few seconds after someone speaks. Tap <Icon name="mark" size={16} /> Mark when something matters.</span></li>
          <li><span className="step-n" aria-hidden="true">3</span><span><strong>Get your notes.</strong> A document you can edit, export to Google Docs or Word, and study from.</span></li>
        </ol>
        <p className="meta with-icon"><Icon name="lock" size={18} />Everything is saved in this browser. No account needed.</p>
      </section>}
    </div>
  </Page>;
}
