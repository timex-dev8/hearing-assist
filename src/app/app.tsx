import { useEffect, useMemo, useState } from 'react';
import { Redirect, Route, Switch, useLocation, useSearch } from 'wouter';
import { Shell, Page } from './shell';
import { Button, Icon, Spinner } from '../components/ui';
import { Home } from './home';
import { Library } from './library';
import { Capture } from './capture';
import { SessionScreen } from './session';
import { Study } from './study';
import { CaptionSettings, Settings } from './settings';
import { store } from '../storage';
import { useNotes } from '../ai/use-notes';
import { cardsFrom, dueCards, review, type Progress } from '../study/cards';
import { asMode } from '../notes/modes';
import type { Session } from '../types';

export default function AppRoot() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [progress, setProgress] = useState<Progress>({});
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [auto, setAuto] = useState('');
  const replace = (s: Session) => setSessions(prev => [s, ...prev.filter(x => x.id !== s.id)].sort((a, b) => b.startedAt - a.startedAt));
  const { jobs, generate } = useNotes(store, replace);

  async function load() {
    setStatus('loading');
    try {
      const [list, saved] = await Promise.all([store.list(), store.loadProgress()]);
      setSessions(list.map(s => ({ ...s, mode: asMode(s.mode) })));
      setProgress(saved);
      setStatus('ready');
    } catch { setStatus('error'); }
  }
  useEffect(() => { void load(); }, []);
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);

  const cards = useMemo(() => cardsFrom(sessions), [sessions]);
  const due = dueCards(cards, progress).length;

  async function persist(session: Session) {
    await store.save(session);
    store.keep();
    replace(session);
  }
  async function remove(id: string) {
    await store.remove(id);
    setSessions(prev => prev.filter(s => s.id !== id));
    navigate('/app/notes', { replace: true });
  }
  function grade(id: string, gotIt: boolean) {
    setProgress(prev => {
      const next = review(prev, id, gotIt);
      void store.saveProgress(next).catch(() => {});
      return next;
    });
  }

  if (status !== 'ready') return <Shell due={0}>
    <Page title={status === 'loading' ? 'Opening' : 'Notes unavailable'}>
      {status === 'loading' ? <p className="working" role="status"><Spinner />Opening your notes…</p>
        : <div className="empty">
          <Icon name="alert" size={40} />
          <p className="empty-title">This browser blocked saving</p>
          <p className="empty-detail">Private Browsing can do this. Open Hearing Assist in a normal window to keep sessions.</p>
          <Button onClick={() => void load()}>Try again</Button>
        </div>}
    </Page>
  </Shell>;

  return <Shell due={due}>
    <Switch>
      <Route path="/app"><Home sessions={sessions} due={due} cards={cards.length} /></Route>
      <Route path="/app/notes"><Library sessions={sessions} jobs={jobs} /></Route>
      <Route path="/app/new"><Capture initialMode={asMode(new URLSearchParams(search).get('mode') ?? 'Lecture')}
        onExit={() => navigate('/app', { replace: true })}
        onSave={async s => {
          await persist(s);
          setAuto(s.allowAI ? s.id : '');
          navigate('/app/session/' + s.id, { replace: true });
          if (s.allowAI) void generate(s);
        }} /></Route>
      <Route path="/app/session/:id">{({ id }) => {
        const session = sessions.find(s => s.id === id);
        if (!session) return <Page title="Session not found" back={{ href: '/app/notes', label: 'Notes' }}>
          <div className="empty"><Icon name="notes" size={40} /><p className="empty-title">It isn’t saved in this browser</p>
            <Button href="/app/notes" kind="secondary">Go to Notes</Button></div>
        </Page>;
        return <SessionScreen key={session.id} session={session} auto={auto === session.id} job={jobs[session.id]}
          generate={generate} onUpdate={persist} onDelete={() => remove(session.id)} />;
      }}</Route>
      <Route path="/app/study"><Study cards={cards} progress={progress} onGrade={grade} /></Route>
      <Route path="/app/settings"><Settings /></Route>
      <Route path="/app/settings/captions"><CaptionSettings /></Route>
      <Route><Redirect to="/app" replace /></Route>
    </Switch>
  </Shell>;
}
