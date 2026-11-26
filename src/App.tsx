import { useEffect, useState } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { Button, Icon, NavButton, Screen } from './components/ui';
import { Notebook } from './screens/notebook';
import { Capture } from './screens/capture';
import { Detail } from './screens/detail';
import { CaptionSettings, Settings } from './screens/settings';
import { deleteSession, keepData, loadSessions, saveSession } from './storage/notebook';
import { useNotes } from './ai/use-notes';
import type { Session } from './types';

export default function App() {
  const [location, navigate] = useLocation();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [auto, setAuto] = useState('');
  const { jobs, generate } = useNotes((id, notes) => setSessions(previous => previous.map(s => s.id === id ? { ...s, notes } : s)));

  async function load() {
    setStatus('loading');
    try { setSessions(await loadSessions()); setStatus('ready'); }
    catch { setStatus('error'); }
  }
  useEffect(() => { void load(); }, []);
  useEffect(() => { window.scrollTo(0, 0); }, [location]);

  async function persist(session: Session) {
    await saveSession(session);
    keepData();
    setSessions(prev => [session, ...prev.filter(s => s.id !== session.id)].sort((a, b) => b.startedAt - a.startedAt));
  }
  const up = (to: string) => () => navigate(to, { replace: true });
  const home = () => navigate('/', { replace: true });

  if (status !== 'ready') return <Screen title="Notebook">
    {status === 'loading' ? <p className="working" role="status"><span className="spinner" aria-hidden="true" />Opening notebook…</p>
      : <div className="empty">
        <Icon name="alert" size={44} weight={1.6} />
        <p className="empty-title">Notebook Unavailable</p>
        <p className="empty-detail">This browser blocked saving. Private Browsing can do this.</p>
        <div className="empty-action"><Button size="small" onClick={() => void load()}>Try Again</Button></div>
      </div>}
  </Screen>;

  return <Switch>
    <Route path="/"><Notebook sessions={sessions} /></Route>
    <Route path="/settings"><Settings onBack={home} /></Route>
    <Route path="/settings/captions"><CaptionSettings onBack={up('/settings')} /></Route>
    <Route path="/new"><Capture onExit={home} onSave={async s => {
      await persist(s);
      setAuto(s.allowAI ? s.id : '');
      navigate('/session/' + s.id, { replace: true });
      if (s.allowAI) void generate(s);
    }} /></Route>
    <Route path="/session/:id">{({ id }) => {
      const session = sessions.find(s => s.id === id);
      if (!session) return <NotFound onBack={home} />;
      return <Detail key={session.id} session={session} auto={auto === session.id} job={jobs[session.id]} generate={generate}
        onBack={home} onUpdate={persist} onDelete={async () => {
          await deleteSession(session.id);
          setSessions(prev => prev.filter(s => s.id !== session.id));
          home();
        }} />;
    }}</Route>
    <Route><NotFound onBack={home} /></Route>
  </Switch>;
}

function NotFound({ onBack }: { onBack: () => void }) {
  return <Screen title="Not Found" leading={<NavButton icon="back" onClick={onBack}>Notebook</NavButton>}>
    <div className="empty">
      <Icon name="note" size={44} weight={1.6} />
      <p className="empty-title">Session Not Found</p>
      <p className="empty-detail">It isn’t saved in this browser.</p>
    </div>
  </Screen>;
}
