import { useEffect, useRef, useState } from 'react';
import { ActionSheet, Button, formatTime, Group, Icon, NavButton, RecordButton, Screen, Segmented, spokenTime, Switch, Waveform } from '../components/ui';
import { MISSED, useCapture } from '../capture/use-capture';
import { usePreferences } from '../settings/use-preferences';
import { presetNames, type Preset } from '../settings/caption-style';
import type { Mode, Session } from '../types';

const quickStyles: Preset[] = ['default', 'large', 'contrast', 'classic'];

export function Capture({ onExit, onSave }: { onExit: () => void; onSave: (session: Session) => Promise<void> }) {
  const cap = useCapture();
  const { prefs, update } = usePreferences();
  const [consent, setConsent] = useState(false);
  const [allowAI, setAllowAI] = useState(false);
  const [mode, setMode] = useState<Mode>('Lecture');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [styling, setStyling] = useState(false);
  const [follow, setFollow] = useState(true);
  const [flash, setFlash] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const userStopped = useRef(false);
  const capturing = cap.startedAt.current !== 0 || cap.phase === 'listening';
  const stopped = cap.phase === 'paused';
  const busy = cap.phase === 'starting' || cap.phase === 'stopping';
  const captions = cap.captions;
  const spoken = captions.filter(c => c.text !== MISSED);

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

  function stop() { userStopped.current = true; void cap.stop(); }
  function leave() {
    if (lock.current) return;
    if (!capturing) { onExit(); return; }
    if (cap.phase === 'listening') stop();
    setLeaving(true);
  }
  async function save() {
    if (!stopped || !spoken.length || lock.current) return;
    lock.current = true; setSaving(true); setSaveError('');
    const date = cap.startedAt.current;
    try {
      await onSave({ id: String(date), startedAt: date, durationMs: cap.elapsed, mode, allowAI, captions,
        title: title.trim() || mode + ' · ' + new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) });
    } catch {
      setSaveError('Could not save in this browser. Your captions are still here. Try again.');
      lock.current = false; setSaving(false);
    }
  }

  const status = cap.phase === 'starting' ? 'Connecting…' : cap.phase === 'listening' ? 'Listening'
    : cap.phase === 'stopping' ? 'Finishing…' : cap.phase === 'paused' ? 'Microphone Off' : 'Ready';

  if (!capturing) return <Screen title="New Session" large={false} className="sheet"
    center={<span>New Session</span>}
    leading={<NavButton onClick={leave}>Cancel</NavButton>}
    toolbar={<div className="toolbar sheet-bar">
      {!!cap.error && <p className="banner" role="alert"><Icon name="alert" size={20} /><span>{cap.error}</span></p>}
      <Button icon="waveform" disabled={!consent || busy} onClick={() => void cap.start(consent)}>
        {busy ? 'Connecting…' : 'Start Live Captions'}</Button>
    </div>}>
    <section className="group">
      <h2 className="group-header"><label htmlFor="session-title">Session title</label></h2>
      <div className="group-body">
        <input id="session-title" className="field" placeholder="Optional, like Cell Biology" maxLength={120} value={title}
          onChange={e => setTitle(e.target.value)} enterKeyHint="done" autoComplete="off" />
      </div>
    </section>
    <section className="group" aria-labelledby="mode-h">
      <h2 className="group-header" id="mode-h">Notes format</h2>
      <Segmented variant="cards" label="Notes format" values={['Lecture', 'Meeting'] as const} selected={mode} onChange={setMode}
        icons={{ Lecture: 'lecture', Meeting: 'meeting' }}
        details={{ Lecture: 'Concepts, examples and study prompts', Meeting: 'Decisions and action items' }} />
    </section>
    <Group header="Before you start" footer="Audio goes to Google Gemini to make captions and isn’t kept. Transcripts stay in this browser.">
      <Switch checked={consent} onChange={setConsent} tile={['agree', 'green']} title="Everyone agrees to transcription" />
      <Switch checked={allowAI} onChange={setAllowAI} tile={['sparkles', 'blue']} title="Make AI notes after saving" detail="Summary and answers from Gemini, using the transcript." />
    </Group>
  </Screen>;

  const live = cap.phase === 'listening';
  return <Screen title={title.trim() || 'Live Captions'} large={false} className={'live' + (flash ? ' flash' : '')}
    leading={<span className={'status ' + cap.phase}>
      <span className="dot" aria-hidden="true" /><span role="status">{status}</span>
      <span className="elapsed" aria-hidden="true">{formatTime(cap.elapsed)}</span>
      <span className="visually-hidden" role="timer">Elapsed {spokenTime(cap.elapsed)}</span>
    </span>}
    trailing={<NavButton strong onClick={leave}>Done</NavButton>}
    toolbar={<div className="live-bar">
      {!!(saveError || (cap.error && stopped)) && <p className="banner" role="alert"><Icon name="alert" size={20} /><span>{saveError || cap.error}</span></p>}
      <div className="live-dock dock-glass">
        <Waveform level={cap.level} active={live} />
        <div className="live-controls">
          <button type="button" className="round-btn" aria-label="Caption style" onClick={() => setStyling(true)}><Icon name="textformat" size={24} /></button>
          <RecordButton state={stopped ? 'record' : 'stop'} disabled={busy || saving}
            label={stopped ? 'Resume captions' : 'Stop microphone'} onClick={() => stopped ? void cap.start(consent) : stop()} />
          {stopped
            ? <button type="button" className="round-btn save" disabled={!spoken.length || saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save'}</button>
            : <button type="button" className="round-btn" aria-label="Jump to newest caption" disabled={follow} onClick={() => setFollow(true)}><Icon name="jump" size={22} weight={2} /></button>}
        </div>
      </div>
    </div>}>
    <span className="aura" aria-hidden="true"><i /><i /></span>
    <p className="live-title">{title.trim() || 'Untitled session'} · {mode}</p>
    {/* Screen readers hear each finished caption once, never the typing indicator. */}
    {prefs.announce && <p className="visually-hidden" aria-live="polite">{spoken.at(-1)?.text}</p>}
    <div className="transcript-live" ref={list} tabIndex={0} role="log" aria-label="Live captions"
      onScroll={e => { const el = e.currentTarget; const atEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 48; if (atEnd !== follow) setFollow(atEnd); }}>
      {!captions.length && !cap.pending && <p className="live-hint">{stopped ? 'No speech was captured.' : 'Captions appear a few seconds after someone speaks.'}</p>}
      {captions.map((line, i) => line.text === MISSED
        ? <p key={i} className="missed"><Icon name="alert" size={16} />Missed audio</p>
        : <p key={i} className={'caption' + (i === captions.length - 1 ? ' newest' : i < captions.length - 2 ? ' settled' : ' recent')}>
          {prefs.timestamps && <span className="cap-time tabular">{formatTime(line.at)}</span>}{line.text}</p>)}
      {cap.pending > 0 && <p className="caption typing" aria-hidden="true"><i /><i /><i /></p>}
    </div>
    <ActionSheet open={styling} onClose={() => setStyling(false)} title="Caption style"
      actions={quickStyles.map(p => ({ label: presetNames[p] + (prefs.preset === p ? ' (Current)' : ''), onSelect: () => { update({ preset: p }); setStyling(false); } }))} />
    <ActionSheet open={leaving} onClose={() => setLeaving(false)}
      title={spoken.length ? 'Save this session before leaving?' : undefined}
      actions={[
        ...(spoken.length ? [{ label: saving ? 'Saving…' : 'Save Session', disabled: !stopped || saving, onSelect: () => { setLeaving(false); void save(); } }] : []),
        { label: 'Discard Captions', destructive: true, onSelect: () => { setLeaving(false); onExit(); } },
      ]} />
  </Screen>;
}
