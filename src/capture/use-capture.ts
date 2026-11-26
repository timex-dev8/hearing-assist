import { useEffect, useRef, useState } from 'react';
import { empty, finish, onWords, type Transcript } from './transcript';
import { MicError, Recorder, type Clip } from './recorder';

export type Phase = 'ready' | 'starting' | 'listening' | 'stopping' | 'paused';
export const MISSED = '[missed audio]';
const QUIET = 0.004; // clips that never get louder than this are skipped as silence

async function upload(clip: Clip, context: string, signal: AbortSignal): Promise<string> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt) await new Promise(r => setTimeout(r, 800 * attempt));
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: clip.audio, context }),
        signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && typeof data.text === 'string') return data.text;
      if (response.status === 400 || response.status === 413) throw new Error(data.error || 'Bad audio clip.');
      last = new Error(data.error || 'Transcription failed.');
    } catch (error) {
      if (signal.aborted) throw error;
      last = error;
    }
  }
  throw last;
}

export function useCapture() {
  const [phase, setPhase] = useState<Phase>('ready');
  const status = useRef<Phase>('ready');
  const [error, setError] = useState('');
  const words = useRef<Transcript>(empty());
  const [transcript, setTranscript] = useState(words.current);
  const [pending, setPending] = useState(0);
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startedAt = useRef(0);  // wall clock of the first start; the session id
  const recorded = useRef(0);   // ms recorded before the current run
  const runStart = useRef(0);
  const recorder = useRef<Recorder | undefined>(undefined);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const abort = useRef(new AbortController());
  const mounted = useRef(true);
  const wakeLock = useRef<WakeLockSentinel | undefined>(undefined);

  function change(next: Phase) {
    status.current = next;
    if (mounted.current) setPhase(next);
  }
  function addCaption(text: string, at: number) {
    words.current = onWords(words.current, text, true, at);
    if (mounted.current) setTranscript(words.current);
  }
  function enqueue(clip: Clip) {
    if (clip.loudest < QUIET) return;
    setPending(n => n + 1);
    const signal = abort.current.signal;
    queue.current = queue.current.then(async () => {
      try {
        const context = words.current.final.filter(c => c.text !== MISSED).map(c => c.text).join(' ').slice(-300);
        const text = await upload(clip, context, signal);
        if (text) addCaption(text, clip.offsetMs);
      } catch {
        if (signal.aborted) return;
        addCaption(MISSED, clip.offsetMs);
        if (mounted.current) setError('Some audio could not be transcribed. Check your internet connection.');
      } finally {
        if (mounted.current) setPending(n => n - 1);
      }
    });
  }
  function releaseWakeLock() {
    void wakeLock.current?.release().catch(() => {});
    wakeLock.current = undefined;
  }
  async function stop() {
    if (status.current !== 'listening' && status.current !== 'starting') return;
    change('stopping');
    recorded.current += Date.now() - runStart.current;
    setElapsed(recorded.current);
    recorder.current?.stop();
    recorder.current = undefined;
    releaseWakeLock();
    setLevel(0);
    await queue.current;
    change('paused');
  }

  /** Must be called directly from a tap. */
  async function start(consent: boolean) {
    if (!consent || (status.current !== 'ready' && status.current !== 'paused')) return;
    setError('');
    change('starting');
    const rec = new Recorder({
      onClip: enqueue,
      onLevel: value => { if (mounted.current) setLevel(value); },
      onInterrupted: () => {
        if (status.current !== 'listening') return;
        setError('The microphone was interrupted, for example by a call or another app.');
        void stop();
      },
    }, recorded.current);
    recorder.current = rec;
    try {
      await rec.start();
      if (recorder.current !== rec) return; // stopped while asking for permission
      if (!startedAt.current) startedAt.current = Date.now();
      runStart.current = Date.now();
      change('listening');
      wakeLock.current = await navigator.wakeLock?.request('screen').catch(() => undefined);
    } catch (cause) {
      recorder.current = undefined;
      if (!mounted.current) return;
      setError(cause instanceof MicError ? cause.message : 'The microphone could not start. Try again.');
      change(startedAt.current ? 'paused' : 'ready');
    }
  }

  useEffect(() => {
    mounted.current = true;
    abort.current = new AbortController();
    // iOS stops the microphone when the page is hidden; make that visible instead of silent.
    const onHide = (e: Event) => {
      if (document.visibilityState !== 'hidden' && e.type !== 'pagehide') return;
      if (status.current === 'listening') setError('Captions stopped because Hearing Assist left the screen. Tap the record button to resume.');
      void stop();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      mounted.current = false;
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
      recorder.current?.stop();
      abort.current.abort();
      releaseWakeLock();
    };
  }, []);
  useEffect(() => {
    if (phase !== 'listening') return;
    const id = setInterval(() => setElapsed(recorded.current + Date.now() - runStart.current), 1000);
    return () => clearInterval(id);
  }, [phase]);

  return { phase, error, transcript, captions: finish(transcript), pending, level, elapsed, startedAt, start, stop };
}
