import { useState } from 'react';

/**
 * The hero demo: captions settle in line by line, one line gets the yellow mark, then a note rises
 * that quotes it with its time. Plays once. Pause holds every animation where it is; Replay swaps the
 * keyframe names (run a / run b) so the browser starts the sequence again from zero.
 * Under Reduce Motion the CSS drops the animations, so the last frame shows and the control is hidden.
 */
export function HeroDemo() {
  const [run, setRun] = useState<'a' | 'b'>('a');
  const [paused, setPaused] = useState(false);
  const [done, setDone] = useState(false);

  const toggle = () => {
    if (done) { setRun(r => (r === 'a' ? 'b' : 'a')); setDone(false); setPaused(false); }
    else setPaused(p => !p);
  };
  const label = done ? 'Replay demo' : paused ? 'Play demo' : 'Pause demo';

  return <figure className="l-demo-wrap" aria-label="Demo: captions of a biology lecture appear, one line is marked, and a note is written from it">
    <div className={'l-demo-run run-' + run + (paused ? ' paused' : '')}>
      <div className="l-demo glass-d">
        <div className="l-demo-top">
          <span className="l-live"><i />Listening</span>
          <span className="l-tt">12:04</span>
          <button type="button" className="l-demo-ctl" aria-label={label} onClick={toggle}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {done ? <path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" />
                : paused ? <path d="M8 5v14l11-7z" fill="currentColor" />
                : <path d="M8 5v14M16 5v14" />}
            </svg>
          </button>
        </div>
        <p className="l-demo-title">Cell Biology · Week 4 · Lecture</p>
        <div className="l-caps" aria-hidden="true">
          <p className="an an1">Osmosis is water moving across a membrane,</p>
          <p className="an an2">toward the side with more solute.</p>
          <p className="an an3"><span className="l-mkx">That one will be on the exam, so mark it.</span></p>
          <p className="an an4 now">So in pure water, the cell swells.</p>
        </div>
      </div>
      <div className="l-note" aria-hidden="true" onAnimationEnd={e => { if (e.target === e.currentTarget) setDone(true); }}>
        <div className="l-nh"><span>Notes</span><span>Cell Biology · Week 4</span></div>
        <div className="l-ni"><span><b>Osmosis</b> water moving toward more solute</span><span className="l-time">1:01</span></div>
        <div className="l-ni"><span><span className="l-mk">That one will be on the exam</span></span><span className="l-time">11:56</span></div>
      </div>
    </div>
  </figure>;
}
