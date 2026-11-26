import { Link, useLocation } from 'wouter';
import type { Session } from '../types';
import { formatTime, Icon, Screen, spokenTime, TabBar } from '../components/ui';
import { MISSED } from '../capture/use-capture';

const DAY = 86400000;
function bucket(time: number, now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (time >= today) return 'Today';
  if (time >= today - DAY) return 'Yesterday';
  if (time >= today - 6 * DAY) return 'Previous 7 Days';
  return new Date(time).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}
const when = (time: number) => {
  const label = bucket(time);
  return label === 'Today' || label === 'Yesterday'
    ? new Date(time).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    : new Date(time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
/** The last thing said is the best reminder of what a session was about. */
const excerpt = (s: Session) => [...s.captions].reverse().find(c => c.text !== MISSED)?.text ?? '';

export function Notebook({ sessions }: { sessions: Session[] }) {
  const [, navigate] = useLocation();
  const groups = new Map<string, Session[]>();
  for (const s of sessions) groups.set(bucket(s.startedAt), [...(groups.get(bucket(s.startedAt)) ?? []), s]);
  return <Screen title="Notebook" toolbar={<TabBar current="notebook" onRecord={() => navigate('/new')} />}>
    {!sessions.length ? <div className="empty">
      <Icon name="waveform" size={44} weight={1.6} />
      <p className="empty-title">No Sessions</p>
      <p className="empty-detail">Tap the red button to caption a lecture or meeting. Sessions are saved on this device.</p>
    </div> : <>
      <p className="meta">{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} · saved on this device</p>
      {[...groups].map(([label, items]) => <section key={label} className="day" aria-label={label}>
        <h2 className="day-title">{label}</h2>
        <ul className="cards-list">
          {items.map(session => <li key={session.id}>
            <Link href={'/session/' + session.id} className="session-card" data-navigates>
              <span className="session-head">
                <span className="session-title">{session.title}</span>
                {session.notes && <span className="chip-tag">Notes</span>}
              </span>
              <span className="session-meta">
                <span aria-hidden="true">{session.mode} · {when(session.startedAt)} · <span className="tabular">{formatTime(session.durationMs)}</span></span>
                <span className="visually-hidden">{session.mode}, {when(session.startedAt)}, {spokenTime(session.durationMs)}{session.notes ? ', has notes' : ''}</span>
              </span>
              {excerpt(session) && <span className="session-quote">“{excerpt(session)}”</span>}
            </Link>
          </li>)}
        </ul>
      </section>)}
    </>}
  </Screen>;
}
