import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Icon, type IconName } from '../components/ui';

/** The mark: a graphite caption card with a line of text and a marked line. */
export function Logo({ size = 28 }: { size?: number }) {
  return <svg className="logo-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="#141518" style={{ stroke: 'var(--line-2)' }} />
    <rect x="7" y="11" width="18" height="3.2" rx="1.6" fill="#f2f2f0" />
    <rect x="7" y="17.6" width="12" height="3.2" rx="1.6" fill="#ffd60a" />
  </svg>;
}
function Wordmark({ href = '/' }: { href?: string }) {
  return <Link href={href} className="wordmark" aria-label="Hearing Assist home"><Logo /><span>Hearing Assist</span></Link>;
}

/** Live captions take the whole screen; the app's navigation steps out of the way and out of the tab order. */
const Immersive = createContext<(on: boolean) => void>(() => {});
export const useImmersive = (on: boolean) => {
  const set = useContext(Immersive);
  useEffect(() => { set(on); return () => set(false); }, [on]);
};

type Place = { href: string; label: string; icon: IconName; match: (path: string) => boolean };
const places: Place[] = [
  { href: '/app', label: 'Home', icon: 'home', match: p => p === '/app' || p === '/app/' },
  { href: '/app/notes', label: 'Notes', icon: 'notes', match: p => p.startsWith('/app/notes') || p.startsWith('/app/session') },
  { href: '/app/study', label: 'Study', icon: 'study', match: p => p.startsWith('/app/study') },
  { href: '/app/settings', label: 'Settings', icon: 'settings', match: p => p.startsWith('/app/settings') },
];

export function Shell({ children, due }: { children: ReactNode; due: number }) {
  const [path] = useLocation();
  const [immersive, setImmersive] = useState(false);
  const recording = path.startsWith('/app/new');
  const item = (p: Place) => {
    const on = p.match(path);
    return <Link key={p.href} href={p.href} className={'nav-item' + (on ? ' on' : '')} aria-current={on ? 'page' : undefined} data-navigates>
      <span className="nav-glyph"><Icon name={p.icon} size={24} fill={on} />{p.icon === 'study' && due > 0 && <span className="nav-badge" aria-hidden="true">{due > 99 ? '99+' : due}</span>}</span>
      <span className="nav-label">{p.label}{p.icon === 'study' && due > 0 && <span className="visually-hidden">, {due} cards due</span>}</span>
    </Link>;
  };
  return <Immersive.Provider value={setImmersive}>
    <div className={'app' + (immersive ? ' immersive' : '')}>
      <a className="skip-link" href="#content">Skip to content</a>
      <aside className="sidebar" inert={immersive}>
        <Wordmark href="/app" />
        <Link href="/app/new" className={'btn primary lg new-session' + (recording ? ' on' : '')} aria-current={recording ? 'page' : undefined} data-navigates>
          <Icon name="mic" size={20} bold /><span>New session</span>
        </Link>
        <nav aria-label="Main" className="side-nav">{places.map(item)}</nav>
        <p className="side-note"><Icon name="lock" size={18} /><span>Sessions are saved in this browser only.</span></p>
      </aside>
      <main id="content" className="app-main">{children}</main>
      <nav className="bottom-nav" aria-label="Main" inert={immersive}>
        {places.slice(0, 2).map(item)}
        <Link href="/app/new" className={'nav-item record' + (recording ? ' on' : '')} aria-current={recording ? 'page' : undefined} data-navigates>
          <span className="nav-glyph"><Icon name="mic" size={24} fill /></span><span className="nav-label">Record</span>
        </Link>
        {places.slice(2).map(item)}
      </nav>
    </div>
  </Immersive.Provider>;
}

/** A screen inside the app: title (focused on arrival, for screen readers), optional back link and actions. */
export function Page({ title, docTitle, children, back, actions, className = '', sub, hideTitle }: {
  title: string; docTitle?: string; children: ReactNode; back?: { href: string; label: string }; actions?: ReactNode;
  className?: string; sub?: ReactNode; hideTitle?: boolean;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    document.title = (docTitle ?? title) + ' · Hearing Assist';
    const active = document.activeElement;
    if (!active || active === document.body || active.closest('[data-navigates]')) heading.current?.focus({ preventScroll: true });
  }, [title]);
  return <div className={'page ' + className}>
    <header className="page-head">
      {back && <Link href={back.href} className="back-link" data-navigates><Icon name="back" size={20} /><span>{back.label}</span></Link>}
      <div className="page-title-row">
        <h1 ref={heading} tabIndex={-1} className={hideTitle ? 'visually-hidden' : 'page-title'}>{title}</h1>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
      {sub && <div className="page-sub">{sub}</div>}
    </header>
    {children}
  </div>;
}
