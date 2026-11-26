import { useId, useMemo, useState } from 'react';
import { Page } from './shell';
import { Button, Choice, Icon } from '../components/ui';
import { modeClasses, modes, type Mode } from '../notes/modes';
import { SessionRow } from './session-row';
import { docToText } from '../notes/doc';
import { dayBucket } from '../util/time';
import type { NoteJob } from '../ai/use-notes';
import type { Session } from '../types';

type Filter = 'All' | Mode;
const haystack = (s: Session) => [s.title, s.mode, s.notes?.summary ?? '', s.doc ? docToText(s.doc) : '', ...s.captions.map(c => c.text)].join('\n').toLowerCase();

export function Library({ sessions, jobs }: { sessions: Session[]; jobs: Record<string, NoteJob> }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const searchId = useId();
  const index = useMemo(() => new Map(sessions.map(s => [s.id, haystack(s)])), [sessions]);
  const q = query.trim().toLowerCase();
  const shown = sessions.filter(s => (filter === 'All' || s.mode === filter) && (!q || index.get(s.id)!.includes(q)));
  const groups = new Map<string, Session[]>();
  for (const s of shown) groups.set(dayBucket(s.startedAt), [...(groups.get(dayBucket(s.startedAt)) ?? []), s]);

  if (!sessions.length) return <Page title="Notes">
    <div className="empty">
      <Icon name="notes" size={40} />
      <p className="empty-title">No sessions yet</p>
      <p className="empty-detail">Start captions in a class or meeting. When you save, the transcript and notes land here.</p>
      <Button href="/app/new" icon="mic">Start a session</Button>
    </div>
  </Page>;

  return <Page title="Notes" className="library">
    <div className="library-tools">
      <label className="search" htmlFor={searchId}>
        <Icon name="search" size={20} />
        <span className="visually-hidden">Search notes and transcripts</span>
        <input id={searchId} type="search" className="search-field" placeholder="Search notes and transcripts" value={query}
          onChange={e => setQuery(e.target.value)} enterKeyHint="search" autoComplete="off" />
      </label>
      <Choice label="Filter by mode" values={['All', ...modes] as Filter[]} selected={filter} onChange={setFilter} classes={modeClasses} />
    </div>
    <p className="meta count" role="status">{shown.length === sessions.length ? sessions.length + (sessions.length === 1 ? ' session' : ' sessions')
      : shown.length + ' of ' + sessions.length + ' sessions'}</p>
    {!shown.length && <div className="empty small">
      <p className="empty-title">Nothing matches{q ? ' “' + query.trim() + '”' : ''}</p>
      <Button kind="secondary" size="sm" onClick={() => { setQuery(''); setFilter('All'); }}>Clear search</Button>
    </div>}
    {[...groups].map(([label, items]) => <section key={label} className="day" aria-label={label}>
      <h2 className="day-title">{label}</h2>
      <ul className="session-list">{items.map(s => <li key={s.id}><SessionRow session={s} writing={jobs[s.id]?.busy} /></li>)}</ul>
    </section>)}
  </Page>;
}
