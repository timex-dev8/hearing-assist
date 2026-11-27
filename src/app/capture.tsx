import { useEffect, useRef, useState } from 'react';
import { ActionSheet, Banner, Button, Choice, formatTime, Icon, RecordButton, spokenTime, Switch, Waveform } from '../components/ui';
import { Page, useImmersive } from './shell';
import { MISSED, useCapture } from '../capture/use-capture';
import { usePreferences } from '../settings/use-preferences';
import { presetNames, type Preset } from '../settings/caption-style';
import { modeClasses, modeIcons, modeInfo, modes, type Mode } from '../notes/modes';
import type { Session } from '../types';

const quickStyles: Preset[] = ['default', 'large', 'contrast', 'classic'];
const MARK_SPAN = 12_000;

export function Capture({ initialMode, onExit, onSave }: { initialMode: Mode; onExit: () => void; onSave: (session: Session) => Promise<void> }) {
  const cap = useCapture();
  const { prefs, update } = usePreferences();
  const [consent, setConsent] = useState(false);
  const [allowAI, setAllowAI] = useState(true);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [styling, setStyling] = useState(false);
  const [follow, setFollow] = useState(true);
  const [flash, setFlash] = useState(false);
  const [marks, setMarks] = useState<number[]>([]);
  const [said, setSaid] = useState('');
  const list = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const userStopped = useRef(false);
  const capturing = cap.startedAt.current !== 0 || cap.phase === 'listening';
  const stopped = cap.phase === 'paused';
  const busy = cap.phase === 'starting' || cap.phase === 'stopping';
  const live = cap.phase === 'listening';
  const captions = cap.captions;
  const spoken = captions.filter(c => c.text !== MISSED);
  useImmersive(capturing);

  useEffect(() => { if (follow) list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' }); }, [captions.length, cap.pending, follow]);
  useEffect(() => {
    if (!capturing || saving) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [capturing, saving]);
  // The microphone stopping without the student asking is the one thing they must never miss.
  useEffect(() => {
    if (cap.phase !== 'paused') return;
    let timer = 0;
    if (!userStopped.current && cap.error && prefs.flash) { setFlash(true); timer = window.setTimeout(() => setFlash(false), 900); }
    userStopped.current = false;
    return () => clearTimeout(timer);
  }, [cap.phase]);
  useEffect(() => { if (!said) return; const t = setTimeout(() => setSaid(''), 2200); return () => clearTimeout(t); }, [said]);

  function stop() { userStopped.current = true; void cap.stop(); }
  function leave() {
    if (lock.current) return;
    if (!capturing) { onExit(); return; }
    if (live) stop();
    setLeaving(true);
  }
  function mark() {
    const at = cap.position();
    setMarks(m => [...m, at]);
    setSaid('Moment marked at ' + spokenTime(at) + '. Your notes will cover it.');
  }
  async function save() {
    if (!stopped || !spoken.length || lock.current) return;
    lock.current = true; setSaving(true); setSaveError('');
    const date = cap.startedAt.current;
    try {
      await onSave({ id: String(date), startedAt: date, durationMs: cap.elapsed, mode, allowAI, captions, marks,
        title: title.trim() || mode + ' · ' + new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) });
    } catch {
      setSaveError('Couldn’t save in this browser. Your captions are still here. Try again.');
      lock.current = false; setSaving(false);
    }
  }

  if (!capturing) return <Page title="New session" className="setup">
    <form className="setup-form" onSubmit={e => { e.preventDefault(); if (consent && !busy) void cap.start(consent); }}>
      <div className="field-group">
        <label className="field-label" htmlFor="session-title">Session title</label>
        <input id="session-title" className="field" placeholder="Optional, like Cell Biology" maxLength={120} value={title}
          onChange={e => setTitle(e.target.value)} enterKeyHint="done" autoComplete="off" />
      </div>
      <fieldset className="field-group plain">
        <legend className="field-label" id="mode-h">What are you listening to?</legend>
        <Choice variant="cards" labelledBy="mode-h" values={modes} selected={mode} onChange={setMode} icons={modeIcons} classes={modeClasses}
          details={Object.fromEntries(modes.map(m => [m, modeInfo[m].when + '. ' + modeInfo[m].gets + '.']))} />
      </fieldset>
      <section className="field-group" aria-labelledby="consent-h">
        <h2 className="field-label" id="consent-h">Before you start</h2>
        <div className="card list">
          <Switch checked={consent} onChange={setConsent} icon="check" title="Everyone agrees to transcription" />
          <Switch checked={allowAI} onChange={setAllowAI} icon="sparkle" title="Write notes with AI after saving"
            detail={modeInfo[mode].gets + ', from the transcript.'} />
        </div>
        <p className="field-hint">Audio goes to Google Gemini to make captions and isn’t kept. Transcripts stay in this browser.</p>
      </section>
      {!!cap.error && <Banner>{cap.error}</Banner>}
      <div className="setup-bar">
        <Button type="submit" size="lg" icon="mic" disabled={!consent || busy}>{busy ? 'Connecting…' : 'Start live captions'}</Button>
        {!consent && <p className="field-hint" aria-hidden="true">Turn on “Everyone agrees” to start.</p>}
      </div>
    </form>
  </Page>;

  const marked = (at: number) => marks.some(m => at <= m + 1500 && at >= m - MARK_SPAN);
  const status = cap.phase === 'starting' ? 'Connecting…' : live ? 'Listening' : cap.phase === 'stopping' ? 'Finishing…' : 'Microphone off';
  const fixedColors = prefs.preset === 'contrast' || prefs.preset === 'classic' || (prefs.preset === 'custom' && prefs.colors !== 'auto');
  return <div className={'live ' + modeInfo[mode].css + (flash ? ' flash' : '') + (fixedColors ? ' fixed-colors' : '')} role="region" aria-label="Live captions screen">
    <header className="live-head">
      <span className={'status ' + cap.phase}>
        <span className="dot" aria-hidden="true" /><span role="status">{status}</span>
        <span className="elapsed tabular" aria-hidden="true">{formatTime(cap.elapsed)}</span>
        <span className="visually-hidden" role="timer">Elapsed {spokenTime(cap.elapsed)}</span>
      </span>
      <h1 className="live-title"><span>{title.trim() || 'Untitled session'}</span><span className="live-mode">{mode}</span></h1>
      <Button kind="secondary" size="sm" onClick={leave}>Done</Button>
    </header>
    {prefs.announce && <p className="visually-hidden" aria-live="polite">{spoken.at(-1)?.text}</p>}
    <p className="visually-hidden" aria-live="assertive">{said}</p>
    <div className="transcript-live" ref={list} tabIndex={0} role="log" aria-label="Live captions"
      onScroll={e => { const el = e.currentTarget; const atEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 48; if (atEnd !== follow) setFollow(atEnd); }}>
      {!captions.length && !cap.pending && <p className="live-hint">{stopped ? 'No speech was captured.' : 'Captions appear a few seconds after someone speaks.'}</p>}
      {captions.map((line, i) => line.text === MISSED
        ? <p key={i} className="missed"><Icon name="alert" size={18} />Missed audio</p>
        : <p key={i} className={'caption' + (i === captions.length - 1 ? ' newest settle' : i < captions.length - 2 ? ' settled' : ' recent') + (marked(line.at) ? ' marked' : '')}>
          {marked(line.at) && <span className="cap-mark"><Icon name="mark" size={18} fill /><span className="visually-hidden">Marked: </span></span>}
          {prefs.timestamps && <span className="cap-time tabular">{formatTime(line.at)}</span>}{line.text}</p>)}
      {cap.pending > 0 && <p className="caption typing" aria-hidden="true"><i /><i /><i /></p>}
    </div>
    {!follow && <button type="button" className="jump" onClick={() => setFollow(true)}><Icon name="down" size={18} bold />Jump to live</button>}
    <footer className="live-dock">
      {!!(saveError || (cap.error && stopped)) && <Banner>{saveError || cap.error}</Banner>}
      {!!said && <p className="toast" aria-hidden="true"><Icon name="mark" size={18} fill />Marked</p>}
      <Waveform level={cap.level} active={live} />
      <div className="live-controls">
        <button type="button" className="round-btn" onClick={() => setStyling(true)} aria-label="Caption style"><Icon name="textformat" size={24} /><span aria-hidden="true">Style</span></button>
        <RecordButton state={stopped ? 'record' : 'stop'} disabled={busy || saving}
          label={stopped ? 'Resume captions' : 'Stop microphone'} onClick={() => stopped ? void cap.start(consent) : stop()} />
        {stopped
          ? <Button size="lg" className="save" disabled={!spoken.length || saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save'}</Button>
          : <button type="button" className="round-btn" disabled={!live} onClick={mark} aria-label={'Mark this moment' + (marks.length ? ', ' + marks.length + ' marked' : '')}>
            <Icon name="mark" size={24} fill={marks.length > 0} /><span aria-hidden="true">Mark{marks.length ? ' ' + marks.length : ''}</span></button>}
      </div>
    </footer>
    <ActionSheet open={styling} onClose={() => setStyling(false)} title="Caption style"
      actions={quickStyles.map(p => ({ label: presetNames[p] + (prefs.preset === p ? ' (current)' : ''), onSelect: () => { update({ preset: p }); setStyling(false); } }))} />
    <ActionSheet open={leaving} onClose={() => setLeaving(false)}
      title={spoken.length ? 'Save this session before leaving?' : 'Leave without saving?'}
      actions={[
        ...(spoken.length ? [{ label: saving ? 'Saving…' : 'Save session', disabled: !stopped || saving, onSelect: () => { setLeaving(false); void save(); } }] : []),
        { label: 'Discard captions', destructive: true, onSelect: () => { setLeaving(false); onExit(); } },
      ]} />
  </div>;
}
