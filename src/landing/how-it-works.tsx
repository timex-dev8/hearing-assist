import { useEffect, useRef, useState, type ReactNode } from 'react';
import { IPhone } from './iphone';

type Screen = 'start' | 'live' | 'notes' | 'study';
const steps: [Screen, string, string][] = [
  ['start', 'Start a session', 'Pick Lecture, Seminar, Meeting or Presentation. Confirm the room knows.'],
  ['live', 'Read along, mark what matters', 'Captions appear as people speak. Tap Mark on anything you want back.'],
  ['notes', 'Get notes that quote the room', 'A summary, key terms and your marks, each linked to its moment.'],
  ['study', 'Study it later', 'Cards made from the session. Again or Got it, nothing more.'],
];

const Check = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>;
const Pause = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 5v14M16 5v14" /></svg>;
const Bookmark = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4h10v16l-5-3.5L7 20z" /></svg>;

const screens: Record<Screen, ReactNode> = {
  start: <div className="ms">
    <p className="ms-t">Start a session</p>
    <div className="ms-seg"><span className="on">Lecture</span><span>Seminar</span><span>Meeting</span><span>Presentation</span></div>
    <div className="ms-row"><span className="ms-check"><Check /></span>Everyone knows they’re being captioned</div>
    <div className="ms-row between">AI notes after class<span className="ms-switch" /></div>
    <span className="ms-btn">Start lecture</span>
  </div>,
  live: <div className="ms">
    <div className="ms-top"><span className="l-live"><i />Listening</span><span>12:04</span></div>
    <div className="ms-caps">
      <p className="ms-cap">Osmosis is water moving across a membrane.</p>
      <p className="ms-cap"><span className="l-mk">That one will be on the exam, so mark it.</span></p>
      <p className="ms-cap now">So in pure water, the cell swells.</p>
    </div>
    <div className="ms-ctl"><span>Aa</span><span className="p"><Pause /></span><span><Bookmark /></span></div>
  </div>,
  notes: <div className="ms">
    <p className="ms-t sm">Cell Biology · Week 4</p>
    <span className="ms-mode"><i />Lecture · 48 min</span>
    <p className="ms-h">Summary</p>
    <p>Osmosis moves water toward more solute, so cells swell in pure water. <span className="ms-tm">0:12</span></p>
    <p className="ms-h">You marked</p>
    <p><span className="l-mk">That one will be on the exam.</span> <span className="ms-tm">11:56</span></p>
    <p className="ms-h">Key terms</p>
    <div className="ms-it"><span><b>Osmosis</b> water toward more solute</span><span className="ms-tm">1:01</span></div>
    <div className="ms-it"><span><b>Diffusion</b> particles spreading out</span><span className="ms-tm">12:03</span></div>
  </div>,
  study: <div className="ms">
    <div className="ms-top quiet"><span>Study</span><span>3 of 8</span></div>
    <div className="ms-progress"><i /></div>
    <div className="ms-card">
      <p className="ms-meta">Cell Biology · Week 4</p>
      <p className="ms-q">Why does a red blood cell swell in pure water?</p>
    </div>
    <span className="ms-btn">Show answer</span>
  </div>,
};

/**
 * Four steps beside a sticky phone. On wide screens the step in the middle of the window drives the
 * phone; clicking a step always works, with or without IntersectionObserver. Screens cross-fade
 * (opacity only, 240ms), stacked so the old one leaves while the new one arrives.
 */
export function HowItWorks() {
  const [current, setCurrent] = useState<Screen>('start');
  const list = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || !list.current) return;
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) setCurrent((e.target as HTMLElement).dataset.step as Screen);
    }, { rootMargin: '-45% 0px -45% 0px' });
    list.current.querySelectorAll('[data-step]').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return <div className="l-how">
    <div className="l-phone-col">
      <IPhone label="The app on an iPhone, showing the step that is selected beside it.">
        {steps.map(([key]) => <div key={key} data-screen={key} className={'l-scr' + (key === 'live' ? ' dark' : '') + (key === 'notes' ? ' white' : '') + (key === current ? ' on' : '')}>
          {screens[key]}
        </div>)}
      </IPhone>
    </div>
    <ol className="l-steps" ref={list}>
      {steps.map(([key, title, line], i) => <li key={key}>
        <button type="button" className="l-step" data-step={key} aria-pressed={key === current} onClick={() => setCurrent(key)}>
          <span className="n">{i + 1}</span>
          <span><span className="st">{title}</span><span className="sl">{line}</span></span>
        </button>
      </li>)}
    </ol>
  </div>;
}
