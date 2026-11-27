import { Link } from 'wouter';
import { Icon } from '../components/ui';
import { modeInfo } from '../notes/modes';
import { MISSED } from '../capture/use-capture';
import { formatTime, shortWhen, spokenTime } from '../util/time';
import type { Session } from '../types';

/** The last thing said is the best reminder of what a session was about. */
export const excerpt = (s: Session) => s.notes?.summary || [...s.captions].reverse().find(c => c.text !== MISSED)?.text || '';

export function ModeBadge({ mode }: { mode: Session['mode'] }) {
  return <span className={'mode-badge ' + modeInfo[mode].css}>{mode}</span>;
}

export function SessionRow({ session, writing }: { session: Session; writing?: boolean }) {
  const info = modeInfo[session.mode];
  const quote = excerpt(session);
  return <Link href={'/app/session/' + session.id} className={'session-row ' + info.css} data-navigates>
    <span className="session-main">
      <span className="session-title">{session.title}</span>
      <span className="session-meta">
        <span aria-hidden="true"><i className="dot" />{session.mode} · {shortWhen(session.startedAt)} · <span className="tabular">{formatTime(session.durationMs)}</span></span>
        <span className="visually-hidden">{session.mode}, {shortWhen(session.startedAt)}, {spokenTime(session.durationMs)}</span>
        {writing ? <span className="tag blue">Writing notes…</span> : session.doc ? <span className="tag blue">Notes</span> : null}
      </span>
      {quote && <span className="session-quote">{quote}</span>}
    </span>
    <Icon name="chevron" size={18} />
  </Link>;
}
