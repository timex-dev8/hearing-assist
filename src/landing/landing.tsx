import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { Icon } from '../components/ui';
import { markedLine, stageLines } from './demo';
import { presetNames } from '../settings/caption-style';
import '../styles/landing.css';

/** Icons are from Icons8 (credited in the footer). They sit beside text, so they're decorative. */
const icon = (name: string) => `/icons/${name}.png`;

function Mark() {
  return <span className="l-mark" aria-hidden="true"><i /><i /></span>;
}

/** Glass pill on wide screens; on phones the section links fold into a Menu button. */
function NavBar() {
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      button.current?.focus();
    };
    const onPointer = (e: PointerEvent) => { if (!bar.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onPointer); };
  }, [open]);

  const close = () => setOpen(false);
  const links = <>
    <a href="#who" onClick={close}>Who it’s for</a>
    <a href="#access" onClick={close}>Accessibility</a>
    <a href="#privacy" onClick={close}>Privacy</a>
  </>;

  return <header className="l-bar glass" ref={bar}>
    <a href="#top" className="l-brand"><Mark />Hearing Assist</a>
    <nav aria-label="Sections" className="l-links">{links}</nav>
    <Link href="/app" className="l-btn dark l-bar-cta">Open the app</Link>
    <button ref={button} type="button" className="l-menu-btn" aria-label="Menu" aria-expanded={open} aria-controls="l-menu"
      onClick={() => setOpen(o => !o)}>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {open ? <><path d="M6 6 18 18" /><path d="M18 6 6 18" /></> : <><path d="M4 9h16" /><path d="M4 15h16" /></>}
      </svg>
    </button>
    {open && <nav id="l-menu" aria-label="Menu" className="l-menu glass">
      {links}
      <Link href="/app" className="l-btn dark">Open the app</Link>
    </nav>}
  </header>;
}

function Phone({ big, children }: { big?: boolean; children: React.ReactNode }) {
  return <div className={'l-phone' + (big ? ' big' : '')}><div className="l-screen">{children}</div></div>;
}

/** Three phones with simplified app screens. Decorative: the figure carries a text alternative. */
function Phones() {
  const lines = stageLines.slice(3, markedLine + 1);
  return <figure className="l-phones" aria-labelledby="phones-alt">
    <figcaption id="phones-alt" className="visually-hidden">The app on a phone: the home screen, live captions of a biology lecture with one line marked, and the notes written afterwards.</figcaption>
    <div className="l-phones-row" aria-hidden="true">
      <Phone>
        <p className="m-greet">Good morning</p>
        <div className="m-start"><span className="m-chip">Lecture</span><span className="m-start-btn"><Icon name="mic" size={16} />Start lecture</span></div>
        <div className="m-row"><Icon name="study" size={18} />8 cards to review</div>
        <div className="m-row"><Icon name="notes" size={18} />Cell Biology · Week 4</div>
      </Phone>
      <Phone big>
        <div className="m-live-top"><span className="m-status"><i />Listening</span><span className="m-time">12:04</span></div>
        <p className="m-title">Cell Biology</p>
        <div className="m-captions">
          {lines.map((line, i) => <p key={line} className={i === lines.length - 1 ? 'now' : i === lines.length - 2 ? 'recent' : ''}>
            {i === lines.length - 1 ? <span className="m-marked">{line}</span> : line}</p>)}
        </div>
        <div className="m-controls"><span><Icon name="textformat" size={20} /></span><span className="m-pause"><i /><i /></span><span><Icon name="mark" size={20} fill /></span></div>
      </Phone>
      <Phone>
        <p className="m-title">Cell Biology · Week 4</p>
        <p className="m-h">Key terms</p>
        <p className="m-item"><strong>Osmosis</strong> water moving toward more solute <span className="m-src">1:01</span></p>
        <p className="m-item"><strong>Diffusion</strong> particles spreading out <span className="m-src">3:40</span></p>
        <p className="m-h">Check yourself</p>
        <p className="m-item">Why does a red blood cell swell in pure water? <span className="m-src">2:15</span></p>
      </Phone>
    </div>
  </figure>;
}

const capKeys = ['default', 'large', 'contrast', 'classic'] as const;
type CapKey = typeof capKeys[number];

function CaptionDemo() {
  const [style, setStyle] = useState<CapKey>('default');
  return <figure className="l-cap glass">
    <div role="group" aria-label="Caption style" className="l-cap-choices">
      {capKeys.map(k => <button key={k} type="button" aria-pressed={style === k} className={'l-pill' + (style === k ? ' on' : '')} onClick={() => setStyle(k)}>{presetNames[k]}</button>)}
    </div>
    <div className={'l-cap-panel ' + style}>
      <p className="old">Osmosis is water moving across a membrane.</p>
      <p className="old"><span className="hl">That one will be on the exam, so mark it.</span></p>
      <p className="now">So in pure water, the cell swells.</p>
    </div>
    <figcaption>Try a caption style. The app has more.</figcaption>
  </figure>;
}

const who: [string, string, string][] = [
  ['deaf', 'Deaf', 'Read every word. You don’t need to hear anything.'],
  ['hearing', 'Hard of hearing', 'Big, clear captions when the sound isn’t enough.'],
  ['adhd', 'ADHD', 'Drifted off? Mark it, catch up, and the notes keep track.'],
];
const steps: [string, string][] = [['microphone', 'Start a session'], ['marker', 'Read and mark'], ['note', 'Get your notes']];
const access: [string, string][] = [
  ['subtitles', 'Five caption sizes, four color schemes'],
  ['speaker', 'Read aloud with VoiceOver'],
  ['flash', 'Screen flash when the mic stops'],
  ['keyboard', 'Works with a keyboard alone'],
  ['text-size', 'Usable at 200% text size'],
  ['contrast', 'Follows Reduce Motion and Increase Contrast'],
];
const faqs: [string, string][] = [
  ['Do I need to install anything?', 'No. It opens in Safari or Chrome, on a phone or a laptop.'],
  ['Does it work offline?', 'No. Captions need an internet connection while you listen.'],
  ['Do speakers need to agree?', 'Yes. Before each session you confirm everyone knows they’re being captioned.'],
];

export function Landing() {
  useEffect(() => { document.title = 'Hearing Assist · Live captions for Deaf, hard of hearing and ADHD'; }, []);
  return <div className="landing">
    <a className="skip-link" href="#top">Skip to content</a>
    <NavBar />

    <main id="top">
      <section className="l-hero" aria-labelledby="hero-h">
        <h1 id="hero-h">Every word, on your screen.</h1>
        <p className="l-sub">Live captions and notes for people who are Deaf, hard of hearing, or have ADHD.</p>
        <Link href="/app" className="l-btn dark lg">Open the app</Link>
        <p className="l-small">Opens in your browser. No account.</p>
        <Phones />
      </section>

      <section id="who" className="l-section" aria-labelledby="who-h">
        <h2 id="who-h" className="l-h2 center">Made for how you follow</h2>
        <ul className="l-who glass">
          {who.map(([name, title, line]) => <li key={name}>
            <span className={'tile lg ' + name}><img src={icon(name)} alt="" width={32} height={32} /></span>
            <h3>{title}</h3>
            <p>{line}</p>
          </li>)}
        </ul>
      </section>

      <section className="l-section l-how" aria-labelledby="how-h">
        <div className="l-how-copy">
          <h2 id="how-h" className="l-h2">How it works</h2>
          <ol className="l-steps">
            {steps.map(([name, label]) => <li key={name} className="glass">
              <span className="tile round"><img src={icon(name)} alt="" width={24} height={24} /></span>{label}</li>)}
          </ol>
        </div>
        <CaptionDemo />
      </section>

      <section id="access" className="l-section" aria-labelledby="access-h">
        <h2 id="access-h" className="l-h2 center">Accessible from the start</h2>
        <p className="l-lead center">Checked on every screen, every time we ship.</p>
        <ul className="l-access glass">
          {access.map(([name, label]) => <li key={name}>
            <span className="tile sm"><img src={icon(name)} alt="" width={22} height={22} /></span>{label}</li>)}
        </ul>
      </section>

      <section id="privacy" className="l-section tight" aria-labelledby="privacy-h">
        <div className="l-privacy glass">
          <span className="tile lg mint"><img src={icon('lock')} alt="" width={30} height={30} /></span>
          <div>
            <h2 id="privacy-h">Private by default</h2>
            <p>Notes stay on your device. Audio clips aren’t kept.</p>
          </div>
        </div>
      </section>

      <section className="l-section l-faq" aria-labelledby="faq-h">
        <h2 id="faq-h" className="l-h2 center">Questions</h2>
        <div className="l-faq-list glass">
          {faqs.map(([q, a]) => <details key={q}><summary>{q}<Icon name="plus" size={22} /></summary><p>{a}</p></details>)}
        </div>
      </section>

      <section className="l-section l-end" aria-labelledby="end-h">
        <h2 id="end-h">Your next class, captioned.</h2>
        <Link href="/app" className="l-btn dark lg">Open the app</Link>
      </section>
    </main>

    <footer className="l-foot">
      <p>Hearing Assist · Icons by <a href="https://icons8.com" rel="noopener">Icons8</a></p>
      <nav aria-label="Footer">
        <a href="#privacy">Privacy</a><a href="#access">Accessibility</a><Link href="/app">Open the app</Link>
      </nav>
    </footer>
  </div>;
}
