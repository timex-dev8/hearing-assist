import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react';
import { ActionSheet, Banner, Button, formatDate, formatTime, Icon, Spinner, spokenTime, Tabs, tabPanelProps, type SheetAction } from '../components/ui';
import { Page } from './shell';
import { ModeBadge } from './session-row';
import { ask } from '../ai/client';
import type { NoteJob } from '../ai/use-notes';
import { MISSED } from '../capture/use-capture';
import { blankDoc, notesToDoc } from '../notes/doc';
import { copyRich, downloadDocx, downloadText } from '../notes/export';
import { modeInfo, templates } from '../notes/modes';
import type { Answer, DocNode, Session } from '../types';

const DocEditor = lazy(() => import('../components/doc-editor'));
type Tab = 'Notes' | 'Transcript' | 'Ask';
type Exchange = { question: string; answer?: Answer; error?: string };

function useWide(query = '(min-width: 1240px)') {
  const [wide, setWide] = useState(() => matchMedia(query).matches);
  useEffect(() => {
    const m = matchMedia(query);
    const on = () => setWide(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [query]);
  return wide;
}

export function SessionScreen({ session: saved, auto, job, generate, onUpdate, onDelete }: {
  session: Session; auto: boolean; job?: NoteJob; generate: (s: Session, replaceDoc?: boolean) => Promise<void>;
  onUpdate: (s: Session) => Promise<void>; onDelete: () => Promise<void>;
}) {
  // Notes saved by the first version have no document yet: show them as one until the student edits.
  const session = saved.doc || !saved.notes ? saved : { ...saved, doc: notesToDoc(saved.notes, saved.captions) };
  const wide = useWide();
  const [tab, setTab] = useState<Tab>(session.doc || auto || job?.busy ? 'Notes' : 'Transcript');
  const [sheet, setSheet] = useState<'' | 'export' | 'more' | 'delete' | 'rewrite'>('');
  const [renaming, setRenaming] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [focusAt, setFocusAt] = useState<number | null>(null);
  const latest = useRef(session);
  latest.current = session;
  const base = useId().replace(/:/g, '');
  useEffect(() => { if (!notice) return; const t = setTimeout(() => setNotice(''), 3000); return () => clearTimeout(t); }, [notice]);

  const side: Tab = tab === 'Notes' ? 'Transcript' : tab;
  const spoken = session.captions.filter(c => c.text !== MISSED).length;
  const info = modeInfo[session.mode];
  const transcriptText = () => session.title + '\n' + formatDate(session.startedAt) + '\n\n'
    + session.captions.map(c => '[' + formatTime(c.at) + '] ' + (c.text === MISSED ? '(missed audio)' : c.text)).join('\n');

  async function attempt(work: () => Promise<unknown>, done: string, failed: string) {
    setSheet(''); setError('');
    try { await work(); setNotice(done); } catch (e) { if ((e as Error)?.name !== 'AbortError') setError(failed); }
  }
  function saveDoc(doc: DocNode) {
    void onUpdate({ ...latest.current, doc, docEditedAt: Date.now() }).catch(() => setError('Couldn’t save your notes in this browser. Copy them somewhere safe.'));
  }
  function jump(at: number | null) {
    if (at == null) return;
    setTab('Transcript');
    setFocusAt(at);
  }
  async function print() {
    setSheet('');
    setTab('Notes');
    await new Promise(r => setTimeout(r, 60));
    window.print();
  }

  const exportActions: SheetAction[] = [
    ...(session.doc ? [
      { label: 'Copy for Google Docs', detail: 'Paste keeps headings, lists and bold', icon: 'copy' as const,
        onSelect: () => void attempt(() => copyRich(session.doc!, session.title), 'Notes copied. Paste into Google Docs.', 'Couldn’t copy from this browser.') },
      { label: 'Download Word file (.docx)', detail: 'Opens in Word, Pages and Google Docs', icon: 'docx' as const,
        onSelect: () => void attempt(() => downloadDocx(session.doc!, session.title), 'Word file downloaded.', 'Couldn’t make the Word file. Try again.') },
      { label: 'Print or save as PDF', icon: 'print' as const, onSelect: () => void print() },
    ] : []),
    { label: 'Copy transcript', icon: 'copy', onSelect: () => void attempt(() => navigator.clipboard.writeText(transcriptText()), 'Transcript copied.', 'Couldn’t copy from this browser.') },
    { label: 'Download transcript (.txt)', icon: 'export', onSelect: () => void attempt(async () => downloadText(transcriptText(), session.title), 'Transcript downloaded.', 'Couldn’t download.') },
  ];

  const notesPanel = <NotesPanel session={session} job={job} auto={auto} onSave={saveDoc} onSource={jump}
    onGenerate={() => void generate(session)} onRewrite={() => session.docEditedAt ? setSheet('rewrite') : void generate(session, true)}
    onAllow={() => void onUpdate({ ...session, allowAI: true }).then(() => generate({ ...session, allowAI: true })).catch(() => setError('Couldn’t save that choice.'))}
    onBlank={() => saveDoc(blankDoc())} />;
  const transcriptPanel = <TranscriptPanel session={session} focusAt={focusAt} onFocused={() => setFocusAt(null)} />;
  const askPanel = <AskPanel session={session} onAllow={() => void onUpdate({ ...session, allowAI: true })} />;
  const panel = (t: Tab) => t === 'Notes' ? notesPanel : t === 'Transcript' ? transcriptPanel : askPanel;

  return <Page title={session.title} back={{ href: '/app/notes', label: 'Notes' }} className={'session ' + info.css}
    actions={<>
      <Button kind="secondary" size="sm" icon="export" onClick={() => setSheet('export')}>Export</Button>
      <Button kind="secondary" size="sm" icon="more" label="More actions" onClick={() => setSheet('more')} />
    </>}
    sub={<p className="session-sub">
      <ModeBadge mode={session.mode} />
      <span aria-hidden="true">{formatDate(session.startedAt)} · <span className="tabular">{formatTime(session.durationMs)}</span>{session.marks?.length ? ' · ' + session.marks.length + ' marked' : ''}</span>
      <span className="visually-hidden">{formatDate(session.startedAt)}, {spokenTime(session.durationMs)}{session.marks?.length ? ', ' + session.marks.length + ' marked moments' : ''}</span>
    </p>}>
    <p className="visually-hidden" role="status">{notice}</p>
    {!!notice && <p className="toast" aria-hidden="true"><Icon name="check" size={18} bold />{notice}</p>}
    {!!error && <Banner>{error}</Banner>}

    {wide ? <div className="session-split">
      <section className="split-main" aria-label="Notes">{notesPanel}</section>
      <section className="split-side" aria-label="Transcript and questions">
        <Tabs label="Session view" base={base} values={['Transcript', 'Ask'] as const} selected={side as 'Transcript' | 'Ask'} onChange={setTab}
          names={{ Ask: 'Ask AI' }} counts={{ Transcript: spoken }} />
        <div {...tabPanelProps(base, side)} className="tab-panel">{panel(side)}</div>
      </section>
    </div> : <>
      <Tabs label="Session view" base={base} values={['Notes', 'Transcript', 'Ask'] as const} selected={tab} onChange={setTab} names={{ Ask: 'Ask AI' }} />
      <div {...tabPanelProps(base, tab)} className="tab-panel">{panel(tab)}</div>
    </>}

    <ActionSheet open={sheet === 'export'} onClose={() => setSheet('')} title="Export" actions={exportActions} />
    <ActionSheet open={sheet === 'more'} onClose={() => setSheet('')} title={session.title} actions={[
      { label: 'Rename', icon: 'notes', onSelect: () => { setSheet(''); setRenaming(true); } },
      { label: 'Delete session', icon: 'trash', destructive: true, onSelect: () => setSheet('delete') },
    ]} />
    <ActionSheet open={sheet === 'delete'} onClose={() => setSheet('')} title="Delete this session?"
      message="The transcript and notes will be deleted from this browser. This can’t be undone."
      actions={[{ label: 'Delete session', icon: 'trash', destructive: true, onSelect: () => { setSheet(''); void onDelete().catch(() => setError('Couldn’t delete. Try again.')); } }]} />
    <ActionSheet open={sheet === 'rewrite'} onClose={() => setSheet('')} title="Replace your notes?"
      message="AI will write fresh notes from the transcript. Your edits to these notes will be lost."
      actions={[{ label: 'Replace with new notes', icon: 'sparkle', destructive: true, onSelect: () => { setSheet(''); void generate(session, true); } }]} />
    <RenameDialog open={renaming} title={session.title} onClose={() => setRenaming(false)}
      onSave={title => { setRenaming(false); void onUpdate({ ...session, title }).then(() => setNotice('Renamed.'), () => setError('Couldn’t rename.')); }} />
  </Page>;
}

function NotesPanel({ session, job, auto, onSave, onSource, onGenerate, onRewrite, onAllow, onBlank }: {
  session: Session; job?: NoteJob; auto: boolean; onSave: (doc: DocNode) => void; onSource: (at: number | null, quote: string) => void;
  onGenerate: () => void; onRewrite: () => void; onAllow: () => void; onBlank: () => void;
}) {
  const info = modeInfo[session.mode];
  if (session.doc) return <article className="doc-page">
    <div className="doc-note">
      <span>{session.notes ? <><Icon name="sparkle" size={16} fill />{session.mode} notes from the transcript. Edit anything; it saves as you type.</> : 'Your notes. They save as you type.'}</span>
      {session.allowAI && session.notes && <Button kind="quiet" size="sm" icon="sparkle" disabled={job?.busy} onClick={onRewrite}>{job?.busy ? 'Rewriting…' : 'Rewrite'}</Button>}
    </div>
    {!!job?.error && <Banner>{job.error}</Banner>}
    <Suspense fallback={<p className="working" role="status"><Spinner />Opening the editor…</p>}>
      <DocEditor doc={session.doc} label={'Notes for ' + session.title} onChange={onSave} onSource={onSource} />
    </Suspense>
  </article>;

  if (job?.busy || (auto && !job)) return <div className="writing" role="status">
    <p className="writing-title"><Spinner />Writing your {session.mode.toLowerCase()} notes…</p>
    <ul className="writing-outline" aria-label="Sections being written">
      {templates[session.mode].map((s, i) => <li key={s.id} style={{ animationDelay: i * 120 + 'ms' }} className="settle">{s.heading}</li>)}
    </ul>
    <p className="meta">This takes about half a minute. You can leave this screen; the notes keep coming.</p>
  </div>;

  return <div className="notes-start">
    {!!job?.error && <Banner>{job.error}</Banner>}
    <div className="notes-offer card">
      <span className="offer-glyph" aria-hidden="true"><Icon name="sparkle" size={26} fill /></span>
      <h2 className="offer-title">{session.allowAI ? 'Write notes from this transcript' : 'Get notes for this session'}</h2>
      <p>{info.gets}. Every line links to the moment it was said.</p>
      <ul className="offer-sections" aria-label="Sections">{templates[session.mode].map(s => <li key={s.id}>{s.heading}</li>)}</ul>
      {session.allowAI ? <Button icon="sparkle" onClick={onGenerate}>{job?.error ? 'Try again' : 'Write notes'}</Button>
        : <><Button icon="sparkle" onClick={onAllow}>Write notes with AI</Button>
          <p className="field-hint">The transcript is sent to Google Gemini. Nothing is kept on the server.</p></>}
    </div>
    <Button kind="quiet" onClick={onBlank}>Or start a blank page</Button>
  </div>;
}

function TranscriptPanel({ session, focusAt, onFocused }: { session: Session; focusAt: number | null; onFocused: () => void }) {
  const list = useRef<HTMLOListElement>(null);
  const [flash, setFlash] = useState(-1);
  const marked = (at: number) => (session.marks ?? []).some(m => at <= m + 1500 && at >= m - 12_000);
  useEffect(() => {
    if (focusAt == null) return;
    let index = 0;
    session.captions.forEach((c, i) => { if (c.at <= focusAt) index = i; });
    const el = list.current?.children[index] as HTMLElement | undefined;
    el?.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    el?.focus({ preventScroll: true });
    setFlash(index);
    onFocused();
    const t = setTimeout(() => setFlash(-1), 2000);
    return () => clearTimeout(t);
  }, [focusAt]);
  if (!session.captions.length) return <p className="empty-detail">No speech was captured.</p>;
  return <ol className="transcript" ref={list}>
    {session.captions.map((line, i) => <li key={i} tabIndex={-1} className={(marked(line.at) ? 'marked' : '') + (flash === i ? ' flash' : '')}>
      <span className="cap-time tabular" aria-label={spokenTime(line.at)}>{formatTime(line.at)}</span>
      {line.text === MISSED ? <span className="missed"><Icon name="alert" size={16} />Missed audio</span>
        : <span className="caption-text">{marked(line.at) && <span className="cap-mark"><Icon name="mark" size={16} fill /><span className="visually-hidden">Marked: </span></span>}{marked(line.at) ? <span className="mk">{line.text}</span> : line.text}</span>}
    </li>)}
  </ol>;
}

function AskPanel({ session, onAllow }: { session: Session; onAllow: () => void }) {
  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState<Exchange[]>([]);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  const id = useId();
  // Set on every mount: StrictMode mounts twice, and a cleanup-only effect would leave it false.
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  async function send(text = question) {
    const q = text.trim();
    if (!q || busy) return;
    setQuestion(''); setBusy(true);
    setThread(t => [...t, { question: q }]);
    const settle = (patch: Partial<Exchange>) => mounted.current && setThread(t => t.map((x, i) => i === t.length - 1 ? { ...x, ...patch } : x));
    try { settle({ answer: await ask(session, q) }); }
    catch (e) { settle({ error: e instanceof Error ? e.message : 'No answer. Try again.' }); }
    finally { if (mounted.current) setBusy(false); }
  }
  if (!session.allowAI) return <div className="notes-offer card">
    <h2 className="offer-title">Ask about this session</h2>
    <p>Answers come only from what was said, with the exact quote they rely on.</p>
    <Button icon="sparkle" onClick={onAllow}>Allow AI for this session</Button>
    <p className="field-hint">The transcript is sent to Google Gemini to answer. Nothing is kept on the server.</p>
  </div>;
  return <div className="ask">
    <div className="thread" role="log" aria-label="Questions and answers">
      {!thread.length && <p className="meta">Ask anything about this session. Answers quote the transcript, or say when it doesn’t cover it.</p>}
      {thread.map((x, i) => <div key={i} className="exchange">
        <p className="bubble mine"><span className="visually-hidden">You asked: </span>{x.question}</p>
        {x.answer ? <div className="bubble theirs settle"><span className="visually-hidden">Answer: </span><p>{x.answer.answer}</p>
          {x.answer.quote && <blockquote className="quote-chip"><Icon name="quote" size={16} fill /><span><span className="visually-hidden">From the transcript: </span>{x.answer.quote}</span></blockquote>}</div>
          : x.error ? <p className="bubble theirs failed" role="alert">{x.error}</p>
          : <p className="bubble theirs typing" aria-label="Reading the transcript"><i /><i /><i /></p>}
      </div>)}
    </div>
    {!thread.length && <div className="suggestions">
      {modeInfo[session.mode].asks.map(q => <button key={q} type="button" className="chip" disabled={busy} onClick={() => void send(q)}>{q}</button>)}
    </div>}
    <form className="composer" onSubmit={e => { e.preventDefault(); void send(); }}>
      <label className="visually-hidden" htmlFor={id}>Question about this session</label>
      <textarea id={id} className="composer-field" rows={1} value={question} maxLength={1000} placeholder="Ask about this session"
        enterKeyHint="send" onChange={e => setQuestion(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} />
      <Button type="submit" icon="send" label="Ask" disabled={busy || !question.trim()} />
    </form>
  </div>;
}

function RenameDialog({ open, title, onClose, onSave }: { open: boolean; title: string; onClose: () => void; onSave: (title: string) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [value, setValue] = useState(title);
  const id = useId();
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) { setValue(title); el.showModal(); }
    if (!open && el.open) el.close();
  }, [open]);
  return <dialog ref={dialog} className="sheet" aria-labelledby={id + 'h'} onClose={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <form className="sheet-card rename" onSubmit={e => { e.preventDefault(); if (value.trim()) onSave(value.trim()); }}>
      <h2 id={id + 'h'}>Rename session</h2>
      <label className="visually-hidden" htmlFor={id}>Session title</label>
      <input id={id} className="field" value={value} maxLength={120} onChange={e => setValue(e.target.value)} autoFocus enterKeyHint="done" />
      <div className="sheet-row">
        <Button kind="secondary" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={!value.trim()}>Save</Button>
      </div>
    </form>
  </dialog>;
}
