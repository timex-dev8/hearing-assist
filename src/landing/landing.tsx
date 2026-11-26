import { useEffect, useId, useState } from 'react';
import { Link } from 'wouter';
import { Button, Choice, Icon, Tabs, tabPanelProps, type IconName } from '../components/ui';
import { Logo, Wordmark } from '../app/shell';
import { modeClasses, modeIcons, modeInfo, modes, type Mode } from '../notes/modes';
import { exampleNotes, markedLine, stageLines } from './demo';
import { captionVars, presetNames, presets, type Preset } from '../settings/caption-style';
import '../styles/landing.css';

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Captions arrive one line at a time and settle, like the live screen. Decorative: the figure has a text alternative. */
function Stage() {
  const [count, setCount] = useState(() => reduced() ? 5 : 2);
  useEffect(() => {
    if (reduced()) return;
    const id = setInterval(() => setCount(n => n >= stageLines.length ? 2 : n + 1), 2600);
    return () => clearInterval(id);
  }, []);
  const shown = stageLines.slice(Math.max(0, count - 4), count);
  const start = Math.max(0, count - 4);
  return <figure className="stage" aria-labelledby="stage-alt">
    <span className="aura" aria-hidden="true"><i /><i /></span>
    <figcaption id="stage-alt" className="visually-hidden">Example: live captions of a biology lecture appear line by line in large text, with one line marked as important.</figcaption>
    <div className="stage-inner" aria-hidden="true">
      <div className="stage-top">
        <span className="status listening"><span className="dot" />Listening<span className="elapsed tabular">12:04</span></span>
        <span className="stage-title">Cell Biology <span className="live-mode">Lecture</span></span>
        <span className="stage-example">Example</span>
      </div>
      <div className="stage-captions">
        {shown.map((line, i) => {
          const index = start + i;
          return <p key={index} className={'caption settle' + (i === shown.length - 1 ? ' newest' : i < shown.length - 2 ? ' settled' : ' recent') + (index === markedLine ? ' marked' : '')}>
            {index === markedLine && <span className="cap-mark"><Icon name="mark" size={20} fill /></span>}{line}</p>;
        })}
      </div>
      <div className="stage-dock">
        <span className="stage-wave">{Array.from({ length: 36 }, (_, i) => <i key={i} style={{ animationDelay: (i * 70) % 900 + 'ms' }} />)}</span>
        <span className="stage-controls">
          <span className="round-btn"><Icon name="textformat" size={22} /><span>Style</span></span>
          <span className="record-btn stop md"><span className="record-glyph" /></span>
          <span className="round-btn"><Icon name="mark" size={22} fill /><span>Mark</span></span>
        </span>
      </div>
      <div className="stage-note">
        <p className="stage-note-head"><Icon name="sparkle" size={16} fill />Notes, as you’d get them</p>
        <p><strong>Osmosis</strong> — water moving across a membrane toward the side with more solute <span className="src">1:01</span></p>
      </div>
    </div>
  </figure>;
}

function CaptionDemo() {
  const [preset, setPreset] = useState<Exclude<Preset, 'custom'>>('default');
  const vars = captionVars(presets[preset]) as React.CSSProperties;
  return <div className="caption-demo">
    <Choice label="Caption style" values={['default', 'large', 'contrast', 'classic'] as const} selected={preset} onChange={setPreset} names={presetNames} />
    <div className={'caption-preview' + (presets[preset].colors !== 'auto' ? ' fixed-colors' : '')} style={vars}>
      {presets[preset].colors === 'auto' && <span className="aura" aria-hidden="true"><i /><i /></span>}
      <p className="caption-sample">Water rushes in, and the cell swells until it bursts.</p>
    </div>
  </div>;
}

function NotesDemo() {
  const [mode, setMode] = useState<Mode>('Lecture');
  const base = useId().replace(/:/g, '');
  const notes = exampleNotes[mode];
  return <div className="notes-demo">
    <Tabs label="Note modes" base={base} values={modes} selected={mode} onChange={setMode} />
    <div {...tabPanelProps(base, mode)} className={'doc-preview ' + modeInfo[mode].css}>
      <p className="doc-preview-head"><span className={'mode-badge ' + modeClasses[mode]}><Icon name={modeIcons[mode]} size={16} fill />{mode}</span><span className="meta">Example notes</span></p>
      <h3 className="doc-preview-title">{notes.title}</h3>
      <div className="doc-body" key={mode}>
        {notes.sections.map(section => <div key={section.heading} className="settle">
          <h4>{section.heading}</h4>
          {section.kind === 'text' ? section.items.map(item => <p key={item.text}>{item.text}{item.at && <> <span className="src">{item.at}</span></>}</p>)
            : (() => {
              const List = section.kind === 'numbered' ? 'ol' : 'ul';
              return <List className={section.kind === 'tasks' ? 'tasks' : undefined}>
                {section.items.map(item => <li key={item.text}>
                  {item.task && <span className="task-box" aria-hidden="true" />}
                  <span>{section.kind === 'numbered' || item.task ? <strong>{item.text}</strong> : item.detail ? <strong>{item.text}</strong> : item.text}
                    {item.detail && (section.kind === 'numbered' ? null : <> — {item.detail}</>)}
                    {item.at && <> <span className="src">{item.at}</span></>}</span>
                  {section.kind === 'numbered' && item.detail && <p>{item.detail}</p>}
                </li>)}
              </List>;
            })()}
        </div>)}
      </div>
    </div>
    <p className="notes-demo-foot">
      <span><Icon name="copy" size={18} />Copy for Google Docs</span>
      <span><Icon name="docx" size={18} />Word (.docx)</span>
      <span><Icon name="print" size={18} />PDF</span>
    </p>
  </div>;
}

/** Sections lift into place once as they scroll in. Content is visible without this. */
function useReveal() {
  useEffect(() => {
    if (reduced() || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('reveal-ready');
    const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
    return () => { io.disconnect(); document.documentElement.classList.remove('reveal-ready'); };
  }, []);
}

const access: [IconName, string, string][] = [
  ['textformat', 'Captions you can set up', 'Five sizes, roomy spacing, Atkinson Hyperlegible, and white or yellow on black.'],
  ['up', 'Follows your text size', 'Everything grows with your phone’s Larger Text setting, and nothing gets cut off at 200%.'],
  ['alert', 'Never stops silently', 'If the microphone stops, it says so in words and in red, with an optional screen flash.'],
  ['notes', 'Works with VoiceOver', 'Each finished caption is read once. Every button has a name.'],
  ['check', 'Keyboard and switch control', 'Every action works without touch, with a clear focus ring.'],
  ['settings', 'Respects your settings', 'Reduce Motion, Increase Contrast, Reduce Transparency and dark mode.'],
];
const faqs: [string, string][] = [
  ['Do I need an account?', 'No. Open the app and start. Sessions are saved in this browser on this device. Accounts and sync across devices are planned.'],
  ['How good are the captions?', 'Captions come from Google Gemini a few seconds after someone speaks. They are best when your device is close to the speaker and the room is quiet. Anything that couldn’t be heard is marked as missed audio, never guessed.'],
  ['Where do the notes come from?', 'From the transcript only. Every note links to the moment it was said, and anything the AI can’t back up with an exact quote is thrown away.'],
  ['Can I use it in a meeting or seminar?', 'Yes. Pick Meeting or Seminar and the notes change shape. Make sure everyone in the room agrees to being transcribed first.'],
  ['Can I move my notes to Google Docs or Word?', 'Yes. Copy for Google Docs keeps headings, lists and bold when you paste. You can also download a Word file or save a PDF.'],
  ['Does it work without internet?', 'Not yet. Captions and notes need a connection. Your saved sessions open without one.'],
  ['Which languages work?', 'US English for now.'],
];

export function Landing() {
  useReveal();
  useEffect(() => { document.title = 'Hearing Assist · Live captions and notes for class'; }, []);
  return <div className="landing">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="l-nav">
      <Wordmark />
      <nav aria-label="Sections" className="l-links">
        <a href="#features">Features</a><a href="#how">How it works</a><a href="#accessibility">Accessibility</a><a href="#faq">FAQ</a>
      </nav>
      <Button href="/app" kind="secondary" size="sm">Open app</Button>
    </header>

    <main id="main">
      <section className="hero" aria-labelledby="hero-h">
        <div className="hero-copy">
          <h1 id="hero-h" className="display">Every word of class, on your screen.</h1>
          <p className="lead">Hearing Assist turns speech into large, readable live captions, then into notes shaped for a lecture, presentation, meeting or seminar. Made for students who are deaf or hard of hearing.</p>
          <div className="hero-actions">
            <Button href="/app/new" size="lg" icon="mic">Start captioning</Button>
            <a href="#how" className="text-link strong">See how it works</a>
          </div>
        </div>
        <Stage />
      </section>

      <ul className="facts" aria-label="At a glance">
        <li><Icon name="check" size={18} bold />No account needed</li>
        <li><Icon name="lock" size={18} />Transcripts stay on your device</li>
        <li><Icon name="check" size={18} bold />Built to WCAG 2.2 AA</li>
        <li><Icon name="check" size={18} bold />Works in Safari and Chrome</li>
      </ul>

      <section id="features" className="feature reveal" aria-labelledby="read-h">
        <div className="feature-copy">
          <h2 id="read-h" className="section-title">Captions you can actually read</h2>
          <p className="lead">Pick a style that works for your eyes, not ours. The newest line is full strength; earlier lines step back so you never lose your place.</p>
          <p>Try the styles. The same ones are in the app, with a custom editor for size, spacing, font and colors.</p>
        </div>
        <CaptionDemo />
      </section>

      <section className="feature wide reveal" aria-labelledby="notes-h">
        <div className="feature-copy center">
          <h2 id="notes-h" className="section-title">Notes that fit what you’re listening to</h2>
          <p className="lead">Choose a mode before you start. A lecture becomes key terms and study questions. A meeting becomes decisions and a to-do list. Then edit it like a doc and take it anywhere.</p>
        </div>
        <NotesDemo />
      </section>

      <section className="feature reverse reveal" aria-labelledby="ask-h">
        <div className="feature-copy">
          <h2 id="ask-h" className="section-title">Ask your lecture a question</h2>
          <p className="lead">Missed something? Ask. Answers come only from what was said, with the exact words they rely on. If the transcript doesn’t cover it, it tells you.</p>
        </div>
        <div className="ask-demo" aria-label="Example question and answer" role="group">
          <p className="bubble mine">What will be on the exam?</p>
          <div className="bubble theirs"><p>Osmosis in red blood cells: why they swell and burst in pure water.</p>
            <blockquote className="quote-chip"><Icon name="quote" size={16} fill /><span>“That one will be on the exam, so mark it.”</span></blockquote></div>
          <p className="bubble mine">Who is taking the lab notes?</p>
          <div className="bubble theirs"><p>There is not enough information in this transcript to answer that question.</p></div>
        </div>
      </section>

      <section className="pair reveal" aria-label="Marking and studying">
        <div className="pair-mark">
          <h2 className="section-title small">Mark what matters</h2>
          <p>One tap on Mark while you read. You never have to look away to type. Marked moments are highlighted in the transcript, and your notes make sure to cover them.</p>
          <div className="mark-demo" aria-hidden="true">
            <p className="caption marked"><span className="cap-mark"><Icon name="mark" size={18} fill /></span>That one will be on the exam, so mark it.</p>
            <span className="round-btn on"><Icon name="mark" size={22} fill /><span>Marked</span></span>
          </div>
        </div>
        <div className="pair-study">
          <h2 className="section-title small">Study from it</h2>
          <p>Key terms and questions from your notes become flashcards. The ones you know come back later, so they stick.</p>
          <div className="flash-demo" aria-hidden="true">
            <span className="meta">Key term</span>
            <span className="flash-front">Osmosis</span>
            <span className="flash-back">Water moving across a membrane toward more solute.</span>
          </div>
        </div>
      </section>

      <section id="how" className="how reveal" aria-labelledby="how-h">
        <h2 id="how-h" className="section-title">How it works</h2>
        <ol className="how-steps">
          <li><span className="how-n" aria-hidden="true">1</span><h3>Pick a mode, then start</h3><p>Lecture, presentation, meeting or seminar. Check that everyone agrees to being transcribed.</p></li>
          <li><span className="how-n" aria-hidden="true">2</span><h3>Read along live</h3><p>Captions appear a few seconds after someone speaks, in your style. Tap Mark when something matters.</p></li>
          <li><span className="how-n" aria-hidden="true">3</span><h3>Get notes you can use</h3><p>An editable document with sources, ready for Google Docs, Word or study cards.</p></li>
        </ol>
      </section>

      <section id="accessibility" className="access reveal" aria-labelledby="access-h">
        <div className="feature-copy">
          <h2 id="access-h" className="section-title">Built for people who read their classes</h2>
          <p className="lead">Accessibility isn’t a settings page here. It’s the whole product, checked automatically on every screen.</p>
        </div>
        <ul className="access-list">
          {access.map(([icon, title, text]) => <li key={title}><span className="access-icon"><Icon name={icon} size={22} /></span><span><strong>{title}</strong>{text}</span></li>)}
        </ul>
      </section>

      <section id="privacy" className="privacy reveal" aria-labelledby="privacy-h">
        <h2 id="privacy-h" className="section-title">What happens to your audio</h2>
        <dl className="privacy-list">
          <div><dt>While you caption</dt><dd>Short clips of audio go to Google Gemini to become text. They aren’t kept.</dd></div>
          <div><dt>When you save</dt><dd>The transcript and notes are stored in this browser, on this device only.</dd></div>
          <div><dt>When you ask for notes</dt><dd>Only for sessions where you allow it, the transcript goes to Gemini to write notes or answer. Nothing is kept on the server.</dd></div>
        </dl>
      </section>

      <section id="faq" className="faq reveal" aria-labelledby="faq-h">
        <h2 id="faq-h" className="section-title">Questions</h2>
        <div className="faq-list">
          {faqs.map(([q, a]) => <details key={q}><summary>{q}<Icon name="plus" size={20} /></summary><p>{a}</p></details>)}
        </div>
      </section>

      <section className="closing" aria-labelledby="close-h">
        <span className="aura" aria-hidden="true"><i /><i /></span>
        <h2 id="close-h" className="display small">Your next class, captioned.</h2>
        <Button href="/app/new" size="lg" icon="mic">Start captioning</Button>
        <p className="meta">Opens in your browser. No download, no account.</p>
      </section>
    </main>

    <footer className="l-foot">
      <Link href="/" className="wordmark" aria-label="Hearing Assist home"><Logo /><span>Hearing Assist</span></Link>
      <nav aria-label="Footer" className="l-foot-links"><Link href="/app">Open the app</Link><a href="#accessibility">Accessibility</a><a href="#privacy">Privacy</a><a href="#faq">FAQ</a></nav>
      <p className="meta">Live captions and notes for students who are deaf or hard of hearing.</p>
    </footer>
  </div>;
}
