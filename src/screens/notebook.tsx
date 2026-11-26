import { useLocation } from 'wouter';
import type { Session } from '../types';
import { formatTime, Group, Icon, NavButton, RecordButton, Row, Screen, spokenTime } from '../components/ui';

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

export function Notebook({ sessions }: { sessions: Session[] }) {
  const [, navigate] = useLocation();
  const groups = new Map<string, Session[]>();
  for (const s of sessions) groups.set(bucket(s.startedAt), [...(groups.get(bucket(s.startedAt)) ?? []), s]);
  return <Screen title="Notebook" className="with-toolbar"
    trailing={<NavButton icon="gear" label="Settings" href="/settings" />}
    toolbar={<div className="toolbar record-bar">
      <RecordButton state="record" label="New session" onClick={() => navigate('/new')} />
    </div>}>
    {!sessions.length ? <div className="empty">
      <Icon name="waveform" size={44} weight={1.6} />
      <p className="empty-title">No Sessions</p>
      <p className="empty-detail">Tap the record button to caption a lecture or meeting. Sessions are saved on this device.</p>
    </div> : [...groups].map(([label, items]) => <Group key={label} header={label}>
      {items.map(session => <Row key={session.id} href={'/session/' + session.id} icon={session.mode === 'Lecture' ? 'lecture' : 'meeting'}
        title={session.title}
        detail={<>
          <span aria-hidden="true">{when(session.startedAt)} · <span className="tabular">{formatTime(session.durationMs)}</span>{session.notes ? ' · Notes' : ''}</span>
          <span className="visually-hidden">{session.mode}, {when(session.startedAt)}, {spokenTime(session.durationMs)}{session.notes ? ', has notes' : ''}</span>
        </>} />)}
    </Group>)}
  </Screen>;
}
