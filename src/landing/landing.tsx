import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import { presetNames } from '../settings/caption-style';
import { useReveal } from '../motion/use-reveal';
import { HeroDemo } from './hero-demo';
import { HowItWorks } from './how-it-works';
import '../styles/landing.css';

/** Icons are from Icons8 (credited in the footer). They sit beside text, so they're decorative. */
const icon = (name: string) => `/icons/${name}.png`;

function Mark() {
  return <span className="l-bm" aria-hidden="true"><i /><i /></span>;
}

/** A frosted pill inside the hero. On phones the section links fold into a Menu button. */
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
    <a href="#how" onClick={close}>How it works</a>
    <a href="#access" onClick={close}>Accessibility</a>
    <a href="#privacy" onClick={close}>Privacy</a>
  </>;

  return <header className="l-bar glass-d" ref={bar} role="banner">
    <a href="#top" className="l-brand" aria-label="Hearing Assist, home"><Mark />Hearing Assist</a>
    <nav aria-label="Sections" className="l-links">{links}</nav>
    <Link href="/app" className="l-btn light sm l-bar-cta">Open the app</Link>
    <button ref={button} type="button" className="l-menu-btn" aria-label="Menu" aria-expanded={open} aria-controls="l-menu"
      onClick={() => setOpen(o => !o)}>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {open ? <><path d="M6 6 18 18" /><path d="M18 6 6 18" /></> : <><path d="M4 9h16" /><path d="M4 15h16" /></>}
      </svg>
    </button>
    {open && <nav id="l-menu" aria-label="Menu" className="l-menu">
      {links}
      <Link href="/app" className="l-btn light block">Open the app</Link>
    </nav>}
  </header>;
}

/** A page section that fades in once when it scrolls into view. */
function Section({ id, reveal, labelledBy, className = '', children }: {
  id?: string; reveal: string; labelledBy: string; className?: string; children: ReactNode;
}) {
  const { ref, className: rv } = useReveal<HTMLElement>();
  return <section ref={ref} id={id} data-reveal={reveal} aria-labelledby={labelledBy} className={['l-sec', rv, className].filter(Boolean).join(' ')}>
    {children}
  </section>;
}

const capKeys = ['default', 'large', 'contrast', 'classic'] as const;
type CapKey = typeof capKeys[number];

function CaptionDemo() {
  const [style, setStyle] = useState<CapKey>('default');
  return <figure className="l-capbox">
    <div role="group" aria-label="Caption style" className="l-seg">
      {capKeys.map(k => <button key={k} type="button" aria-pressed={style === k} onClick={() => setStyle(k)}>{presetNames[k]}</button>)}
    </div>
    <div className={'l-cap-scr ' + style}>
      <p className="old">Osmosis is water moving across a membrane.</p>
      <p className="old"><span className="hl">That one will be on the exam, so mark it.</span></p>
      <p className="now">So in pure water, the cell swells.</p>
    </div>
    <figcaption>Try a style. The app has more sizes.</figcaption>
  </figure>;
}

const whoFor: [string, string, string][] = [
  ['deaf', 'Deaf', 'Read every word as it’s said. You don’t need to hear anything.'],
  ['hearing', 'Hard of hearing', 'Big, clear captions for when the sound isn’t enough.'],
  ['adhd', 'ADHD', 'Drifted off? Mark it, catch up, and the notes keep track.'],
];
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
  ['How accurate are the captions?', 'Close, not perfect. Names, technical terms and noisy rooms can trip it up. Every note links to the transcript, so you can check what was really said.'],
  ['Does it work offline?', 'No. Captions need an internet connection while you listen.'],
  ['Do speakers need to agree?', 'Yes. Before each session you confirm everyone knows they’re being captioned.'],
];

const RecordGlyph = () => <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" /></svg>;
const MarkGlyph = () => <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M7 4h10v16l-5-3.5L7 20z" /></svg>;
const NotesGlyph = () => <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><rect x="5" y="3.5" width="14" height="17" rx="2.5" /><path d="M9 8.5h6M9 12h6M9 15.5h3.5" /></svg>;

export function Landing() {
  useEffect(() => { document.title = 'Hearing Assist · Live captions for Deaf, hard of hearing and ADHD'; }, []);
  return <div className="landing">
    <a className="skip-link" href="#main">Skip to content</a>

    <section className="l-hero" aria-labelledby="hero-h">
      <div className="l-wrap">
        <NavBar />
        <div className="l-hero-grid" id="top">
          <div>
            <h1 id="hero-h">Every word, on your screen.</h1>
            <p className="l-lede">Live captions and notes from the room you’re in. Read along, mark what matters, study it later.</p>
            <p className="l-forl" id="for-l">Made for people who are</p>
            <ul className="l-who-chips" aria-labelledby="for-l">
              {whoFor.map(([name, title]) => <li key={name} className="glass-d"><span className="ic" aria-hidden="true"><img src={icon(name)} alt="" width={20} height={20} /></span>{title}</li>)}
            </ul>
            <div className="l-acts">
              <Link href="/app" className="l-btn light">Open the app</Link>
              <a href="#how" className="l-text-btn">See how it works</a>
            </div>
            <p className="l-fine">Safari and Chrome. No account, no meeting bot.</p>
          </div>
          <HeroDemo />
        </div>
        <ul className="l-does" aria-label="What it does">
          <li className="glass-d"><span className="ic rec" aria-hidden="true"><RecordGlyph /></span><span><b>Record</b><span className="l">Captions appear as people speak</span></span></li>
          <li className="glass-d"><span className="ic" aria-hidden="true"><MarkGlyph /></span><span><b>Mark</b><span className="l">Tap once to keep a moment</span></span></li>
          <li className="glass-d"><span className="ic" aria-hidden="true"><NotesGlyph /></span><span><b>Notes</b><span className="l">Each point links to when it was said</span></span></li>
        </ul>
      </div>
    </section>

    <main id="main">
      <Section id="how" reveal="how" labelledBy="how-h">
        <div className="l-wrap">
          <p className="l-kick">How it works</p>
          <h2 id="how-h" className="l-h2">From the lecture hall to your notes</h2>
          <HowItWorks />
        </div>
      </Section>

      <Section id="who" reveal="who" labelledBy="who-h">
        <div className="l-wrap">
          <p className="l-kick">Who it’s for</p>
          <h2 id="who-h" className="l-h2">Made for how you follow</h2>
          <div className="l-who">
            {whoFor.map(([name, title, line]) => <div key={name} className="glass-l">
              <span className="ic" aria-hidden="true"><img src={icon(name)} alt="" width={28} height={28} /></span>
              <h3>{title}</h3>
              <p>{line}</p>
            </div>)}
          </div>
        </div>
      </Section>

      <Section reveal="cap" labelledBy="cap-h">
        <div className="l-wrap l-capsec">
          <div>
            <p className="l-kick">Caption styles</p>
            <h2 id="cap-h" className="l-h2">Captions you can read from the back row</h2>
            <p className="l-leadx">Four styles and five sizes. Change them mid-lecture without stopping.</p>
          </div>
          <CaptionDemo />
        </div>
      </Section>

      <Section id="access" reveal="access" labelledBy="access-h">
        <div className="l-wrap">
          <p className="l-kick">Accessibility</p>
          <h2 id="access-h" className="l-h2">Accessible from the start</h2>
          <p className="l-leadx">Checked on every screen, every time we ship.</p>
          <ul className="l-acc">
            {access.map(([name, label]) => <li key={name} className="glass-l">
              <span className="ic" aria-hidden="true"><img src={icon(name)} alt="" width={22} height={22} /></span>{label}</li>)}
          </ul>
        </div>
      </Section>

      <Section id="privacy" reveal="privacy" labelledBy="privacy-h">
        <div className="l-wrap l-priv">
          <div>
            <p className="l-kick">Privacy</p>
            <h2 id="privacy-h" className="l-h2">Private by default</h2>
          </div>
          <dl className="glass-l">
            <dt>Audio</dt><dd>Sent to be transcribed, then dropped. Clips aren’t kept.</dd>
            <dt>Notes</dt><dd>Saved in your browser, on this device. No account to sign in to.</dd>
            <dt>AI</dt><dd>Notes are written from the transcript. Turn AI notes off before you start and you get the transcript only.</dd>
          </dl>
        </div>
      </Section>

      <Section reveal="faq" labelledBy="faq-h">
        <div className="l-wrap">
          <h2 id="faq-h" className="l-h2">Questions</h2>
          <div className="l-faq-list glass-l">
            {faqs.map(([q, a]) => <details key={q}>
              <summary>{q}<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg></summary>
              <p>{a}</p>
            </details>)}
          </div>
        </div>
      </Section>
    </main>

    <section className="l-end" aria-labelledby="end-h">
      <div className="l-wrap">
        <h2 id="end-h">Your next class, captioned.</h2>
        <div className="l-acts">
          <Link href="/app" className="l-btn light">Open the app</Link>
          <span className="l-end-meta">Opens in your browser. No account.</span>
        </div>
      </div>
    </section>

    <footer className="l-wrap l-foot">
      <span className="l-foot-brand"><a href="#top" className="l-brand"><Mark />Hearing Assist</a><span>Icons by <a href="https://icons8.com" rel="noopener">Icons8</a></span></span>
      <nav aria-label="Footer">
        <a href="#privacy">Privacy</a><a href="#access">Accessibility</a><Link href="/app">Open the app</Link>
      </nav>
    </footer>
  </div>;
}
