import { useEffect, useRef, useState } from 'react';
import { ActionSheet, Button, formatTime, Group, Icon, NavButton, RecordButton, Screen, Segmented, spokenTime, Switch, Waveform } from '../components/ui';
import { MISSED, useCapture } from '../capture/use-capture';
import { usePreferences } from '../settings/use-preferences';
import type { Mode, Session } from '../types';

export function Capture({ onExit, onSave }: { onExit: () => void; onSave: (session: Session) => Promise<void> }) {
  const cap = useCapture();
  const { prefs } = usePreferences();
  const [consent, setConsent] = useState(false);
  const [allowAI, setAllowAI] = useState(false);
  const [mode, setMode] = useState<Mode>('Lecture');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [leaving, setLeaving] = useState(false);
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
    if (!userStopped.current && cap.error && prefs.flash) { setFlash(true); setTimeout(() => setFlash(false), 900); }
    userStopped.current = false;
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
    toolbar={<div className="toolbar">
      {!!cap.error && <p className="banner" role="alert"><Icon name="alert" size={20} /><span>{cap.error}</span></p>}
      <Button icon="waveform" size="large" disabled={!consent || busy} onClick={() => void cap.start(consent)}>
        {busy ? 'Connecting…' : 'Start Live Captions'}</Button>
    </div>}>
    <Group>
      <label className="visually-hidden" htmlFor="session-title">Session title</label>
      <input id="session-title" className="field" placeholder="Title (optional)" maxLength={120} value={title}
        onChange={e => setTitle(e.target.value)} enterKeyHint="done" autoComplete="off" />
    </Group>
    <Group header="Notes Format" footer={mode === 'Lecture' ? 'Key concepts, examples and study prompts.' : 'Discussion, decisions and action items.'}>
      <div className="block"><Segmented label="Notes format" values={['Lecture', 'Meeting'] as const} selected={mode} onChange={setMode} /></div>
    </Group>
    <Group header="Before You Start" footer="Audio is sent to Google Gemini to make captions and isn’t kept. Transcripts stay in this browser.">
      <Switch checked={consent} onChange={setConsent} title="Everyone agrees to transcription" />
      <Switch checked={allowAI} onChange={setAllowAI} title="Make AI notes after saving" detail="Sends the transcript to Gemini for notes and questions." />
    </Group>
  </Screen>;

  const live = cap.phase === 'listening';
  return <Screen title={title.trim() || 'Live Captions'} large={false} className={'live' + (flash ? ' flash' : '')}
    center={<span className={'status ' + cap.phase} role="status"><span className="dot" aria-hidden="true" />{status}</span>}
    trailing={<NavButton strong onClick={leave}>Done</NavButton>}
    toolbar={<div className="toolbar live-bar">
      {!!(saveError || (cap.error && stopped)) && <p className="banner" role="alert"><Icon name="alert" size={20} /><span>{saveError || cap.error}</span></p>}
      <Waveform level={cap.level} active={live} />
      <p className="clock tabular"><span aria-hidden="true">{formatTime(cap.elapsed)}</span><span className="visually-hidden">Elapsed {spokenTime(cap.elapsed)}</span></p>
      <div className="live-controls">
        <span className="live-side" />
        <RecordButton state={stopped ? 'record' : 'stop'} disabled={busy || saving}
          label={stopped ? 'Resume captions' : 'Stop microphone'} onClick={() => stopped ? void cap.start(consent) : stop()} />
        <span className="live-side end">
          {stopped && <Button size="small" kind="tinted" disabled={!spoken.length || saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save'}</Button>}
        </span>
      </div>
    </div>}>
    {/* Screen readers hear each finished caption once, never the typing indicator. */}
    {prefs.announce && <p className="visually-hidden" aria-live="polite">{spoken.at(-1)?.text}</p>}
    <div className="transcript-live" ref={list} tabIndex={0} role="log" aria-label="Live captions"
      onScroll={e => { const el = e.currentTarget; const atEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 48; if (atEnd !== follow) setFollow(atEnd); }}>
      {!captions.length && !cap.pending && <p className="live-hint">{stopped ? 'No speech was captured.' : 'Captions appear a few seconds after someone speaks.'}</p>}
      {captions.map((line, i) => line.text === MISSED
        ? <p key={i} className="missed"><Icon name="alert" size={16} />Missed audio</p>
        : <p key={i} className={'caption' + (i < captions.length - 2 ? ' settled' : '')}>
          {prefs.timestamps && <span className="cap-time tabular">{formatTime(line.at)}</span>}{line.text}</p>)}
      {cap.pending > 0 && <p className="caption typing" aria-hidden="true"><i /><i /><i /></p>}
    </div>
    {!follow && captions.length > 0 && <button type="button" className="jump" onClick={() => setFollow(true)}>Jump to Live</button>}
    <ActionSheet open={leaving} onClose={() => setLeaving(false)}
      title={spoken.length ? 'Save this session before leaving?' : undefined}
      actions={[
        ...(spoken.length ? [{ label: saving ? 'Saving…' : 'Save Session', disabled: !stopped || saving, onSelect: () => { setLeaving(false); void save(); } }] : []),
        { label: 'Discard Captions', destructive: true, onSelect: () => { setLeaving(false); onExit(); } },
      ]} />
  </Screen>;
}
