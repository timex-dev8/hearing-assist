import { useEffect, useRef, useState } from 'react';
import { ActionSheet, Button, formatDate, formatTime, Group, Icon, NavButton, Row, Screen, Segmented, spokenTime } from '../components/ui';
import { ask } from '../ai/client';
import type { NoteJob } from '../ai/use-notes';
import { MISSED } from '../capture/use-capture';
import type { Answer, Session } from '../types';

type Tab = 'Transcript' | 'Notes' | 'Ask';
type Exchange = { question: string; answer?: Answer; error?: string };

export function Detail({ session, auto, job, generate, onUpdate, onDelete, onBack }: {
  job?: NoteJob; generate: (s: Session) => Promise<void>;
  session: Session; auto: boolean; onUpdate: (s: Session) => Promise<void>; onDelete: () => Promise<void>; onBack: () => void;
}) {
  const [tab, setTab] = useState<Tab>(auto || session.notes ? 'Notes' : 'Transcript');
  const [question, setQuestion] = useState('');
  const [thread, setThread] = useState<Exchange[]>([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [shared, setShared] = useState('');
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (!shared) return; const t = setTimeout(() => setShared(''), 2500); return () => clearTimeout(t); }, [shared]);

  async function run(name: string, operation: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(name); setError('');
    try { await operation(); }
    catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'That didn’t work. Try again.'); }
    finally { lock.current = false; if (mounted.current) setBusy(''); }
  }

  const text = () => session.title + '\n' + formatDate(session.startedAt) + '\n\n'
    + session.captions.map(c => '[' + formatTime(c.at) + '] ' + (c.text === MISSED ? '(missed audio)' : c.text)).join('\n');
  async function share() {
    setShared('');
    try {
      if (navigator.share) { await navigator.share({ title: session.title, text: text() }); return; }
      await navigator.clipboard.writeText(text());
      setShared('Transcript copied.');
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') setShared('Couldn’t share the transcript from this browser.');
    }
  }
  async function send() {
    const q = question.trim();
    if (!q || lock.current) return;
    setQuestion('');
    setThread(t => [...t, { question: q }]);
    await run('Reading transcript…', async () => {
      try {
        const answer = await ask(session, q);
        if (mounted.current) setThread(t => t.map((x, i) => i === t.length - 1 ? { ...x, answer } : x));
      } catch (e) {
        if (mounted.current) setThread(t => t.map((x, i) => i === t.length - 1 ? { ...x, error: e instanceof Error ? e.message : 'No answer. Try again.' } : x));
      }
    });
  }

  const spoken = session.captions.filter(c => c.text !== MISSED).length;
  return <Screen title={session.title}
    leading={<NavButton icon="back" onClick={onBack}>Notebook</NavButton>}
    trailing={<NavButton icon="share" label="Share transcript" onClick={() => void share()} />}>
    <p className="meta">
      <span aria-hidden="true">{session.mode} · {formatDate(session.startedAt)} · <span className="tabular">{formatTime(session.durationMs)}</span></span>
      <span className="visually-hidden">{session.mode}, {formatDate(session.startedAt)}, {spokenTime(session.durationMs)}</span>
    </p>
    <div className="sticky-tabs"><Segmented label="View" values={['Transcript', 'Notes', 'Ask'] as const} selected={tab} onChange={setTab} /></div>
    <p className="visually-hidden" role="status">{shared}</p>
    {!!shared && <p className="toast" aria-hidden="true">{shared}</p>}
    {!!error && <p className="banner" role="alert"><Icon name="alert" size={20} /><span>{error}</span></p>}

    {tab === 'Transcript' && <>
      <Group header={spoken + (spoken === 1 ? ' Caption' : ' Captions')}>
        <ol className="transcript">
          {session.captions.map((line, i) => <li key={i}>
            <span className="cap-time tabular" aria-label={spokenTime(line.at)}>{formatTime(line.at)}</span>
            {line.text === MISSED ? <span className="missed"><Icon name="alert" size={16} />Missed audio</span> : <span className="caption-text">{line.text}</span>}
          </li>)}
        </ol>
      </Group>
      <Group>
        <Row title="Delete Session" destructive onClick={() => setDeleting(true)} />
      </Group>
    </>}

    {tab !== 'Transcript' && !session.allowAI && <Group footer="The transcript is sent to Google Gemini to answer. Nothing is kept on the server.">
      <div className="block stack">
        <p className="block-title">Use AI for this session?</p>
        <p className="prose">Notes and answers come only from what was said, with the exact quote they rely on.</p>
        <Button disabled={!!busy} onClick={() => void run('Saving…', () => onUpdate({ ...session, allowAI: true }))}>Allow AI</Button>
      </div>
    </Group>}

    {tab === 'Notes' && session.allowAI && <>
      {job?.busy && <p className="working" role="status"><span className="spinner" aria-hidden="true" />Writing notes…</p>}
      {!!job?.error && <p className="banner" role="alert"><Icon name="alert" size={20} /><span>{job.error}</span></p>}
      {session.notes ? <>
        <Group header="Summary"><p className="block">{session.notes.summary}</p></Group>
        {session.notes.sections.map(section => <Group key={section.heading} header={section.heading}>
          {!section.items.length && <p className="block prose">None mentioned.</p>}
          {section.items.map((item, i) => <div key={i} className="block note"><p>{item.text}</p><Source quote={item.quote} /></div>)}
        </Group>)}
      </> : !job?.busy && <div className="empty">
        <Icon name="note" size={44} weight={1.6} />
        <p className="empty-title">No Notes Yet</p>
        <p className="empty-detail">{session.mode === 'Lecture' ? 'Key concepts, examples and study prompts' : 'Discussion, decisions and action items'}, each with the quote it came from.</p>
        <div className="empty-action"><Button size="small" icon="note" onClick={() => void generate(session)}>{job?.error ? 'Try Again' : 'Make Notes'}</Button></div>
      </div>}
    </>}

    {tab === 'Ask' && session.allowAI && <>
      <div className="thread" role="log" aria-label="Questions and answers">
        {!thread.length && <p className="live-hint">Ask anything about this session. Answers quote the transcript, or say when it doesn’t cover it.</p>}
        {thread.map((x, i) => <div key={i} className="exchange">
          <p className="bubble mine"><span className="visually-hidden">You asked: </span>{x.question}</p>
          {x.answer ? <div className="bubble theirs"><span className="visually-hidden">Answer: </span><p>{x.answer.answer}</p>{x.answer.quote && <Source quote={x.answer.quote} />}</div>
            : x.error ? <p className="bubble theirs failed" role="alert">{x.error}</p>
            : <p className="bubble theirs typing" aria-label="Reading transcript"><i /><i /><i /></p>}
        </div>)}
      </div>
      <form className="composer" onSubmit={e => { e.preventDefault(); void send(); }}>
        <label className="visually-hidden" htmlFor="question">Question about this session</label>
        <textarea id="question" className="composer-field" rows={1} value={question} maxLength={1000} placeholder="Ask a question"
          enterKeyHint="send" onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); } }} />
        <button type="submit" className="send" disabled={!!busy || !question.trim()} aria-label="Send question"><Icon name="send" size={20} weight={2.4} /></button>
      </form>
    </>}

    <ActionSheet open={deleting} onClose={() => setDeleting(false)}
      message="This session and its notes will be deleted from this browser. This can’t be undone."
      actions={[{ label: 'Delete Session', destructive: true, disabled: !!busy, onSelect: () => { setDeleting(false); void run('Deleting…', onDelete); } }]} />
  </Screen>;
}

function Source({ quote }: { quote: string }) {
  return <blockquote className="source"><Icon name="quote" size={16} /><span><span className="visually-hidden">From the transcript: </span>{quote}</span></blockquote>;
}
