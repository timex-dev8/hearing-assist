import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'wouter';

/* Icons: one stroke set at SF Symbols weight. */
const paths = {
  back: 'M15 4.5 7.5 12l7.5 7.5',
  chevron: 'm9.5 5.5 6.5 6.5-6.5 6.5',
  gear: 'M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z M19.4 13.5c.1-.5.1-1 .1-1.5s0-1-.1-1.5l2-1.6-2-3.4-2.4.9a7.5 7.5 0 0 0-2.6-1.5L14 2.5h-4l-.4 2.4A7.5 7.5 0 0 0 7 6.4l-2.4-.9-2 3.4 2 1.6c-.1.5-.1 1-.1 1.5s0 1 .1 1.5l-2 1.6 2 3.4 2.4-.9a7.5 7.5 0 0 0 2.6 1.5l.4 2.4h4l.4-2.4a7.5 7.5 0 0 0 2.6-1.5l2.4.9 2-3.4-2-1.6Z',
  share: 'M12 3v12 M7.5 7.5 12 3l4.5 4.5 M6 11H5v10h14V11h-1',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  lecture: 'M2.5 9 12 4.5 21.5 9 12 13.5Z M6.5 11v4.5c3.5 2.6 7.5 2.6 11 0V11 M21.5 9v5',
  meeting: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2.5 20c.4-3.6 3-5.5 6.5-5.5s6.1 1.9 6.5 5.5 M16 4.3a3.5 3.5 0 0 1 0 6.4 M18 14.8c2 .7 3.3 2.4 3.5 5.2',
  send: 'M12 19V5 M6.5 10.5 12 5l5.5 5.5',
  quote: 'M7.5 10.5H5.2c0-2.6 1-4 3-4.6 M7.5 10.5v4.5H3.5v-4.5 M17.5 10.5h-2.3c0-2.6 1-4 3-4.6 M17.5 10.5v4.5h-4v-4.5',
  waveform: 'M3 10v4 M7 7v10 M11 4v16 M15 8v8 M19 10.5v3',
  note: 'M6 3.5h8.5l3.5 3.5v13.5H6Z M14 3.5V7h4 M9 12h6 M9 15.5h4',
  alert: 'M12 4 2.8 19.5h18.4Z M12 10v4.5 M12 17.2v.3',
};
export type IconName = keyof typeof paths;
export function Icon({ name, size = 22, weight = 1.8 }: { name: IconName; size?: number; weight?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d={paths[name]} fill="none" stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

/** A screen with an iOS navigation bar. The large title collapses into the bar while scrolling. */
export function Screen({ title, leading, trailing, children, toolbar, large = true, className = '', center }: {
  title: string; leading?: ReactNode; trailing?: ReactNode; children: ReactNode; toolbar?: ReactNode;
  large?: boolean; className?: string; center?: ReactNode;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const [collapsed, setCollapsed] = useState(!large);
  useEffect(() => {
    if (!large || !heading.current) return;
    const observer = new IntersectionObserver(([entry]) => setCollapsed(!entry.isIntersecting), { rootMargin: '-48px 0px 0px 0px' });
    observer.observe(heading.current);
    return () => observer.disconnect();
  }, [large]);
  // Each screen announces itself: title for the tab, focus on the heading for screen readers.
  useEffect(() => {
    document.title = title + ' – Hearing Assist';
    if (document.activeElement === document.body || document.activeElement?.closest('[data-navigates]')) heading.current?.focus({ preventScroll: true });
  }, [title]);
  return <div className={'screen ' + className}>
    <a className="skip-link" href="#content">Skip to content</a>
    <header className={'navbar' + (collapsed ? ' collapsed' : '')}>
      <div className="nav-side">{leading}</div>
      <div className="nav-center" aria-hidden={large ? !collapsed : undefined}>{center ?? (large ? title : null)}</div>
      <div className="nav-side end">{trailing}</div>
    </header>
    <main id="content" className="content">
      <h1 ref={heading} tabIndex={-1} className={large ? 'large-title' : 'small-title'}>{title}</h1>
      {children}
    </main>
    {toolbar}
  </div>;
}

export function NavButton({ children, onClick, icon, strong, label, href }: {
  children?: ReactNode; onClick?: () => void; icon?: IconName; strong?: boolean; label?: string; href?: string;
}) {
  const cls = 'nav-btn' + (strong ? ' strong' : '') + (children ? '' : ' icon-only');
  const body = <>{icon && <Icon name={icon} size={icon === 'back' ? 26 : 24} weight={icon === 'back' ? 2.2 : 1.8} />}{children}</>;
  return href
    ? <Link href={href} className={cls} aria-label={label} data-navigates>{body}</Link>
    : <button type="button" className={cls} onClick={onClick} aria-label={label} data-navigates>{body}</button>;
}

export function Button({ children, onClick, kind = 'filled', disabled, icon, label, danger, size }: {
  children?: ReactNode; onClick: () => void; kind?: 'filled' | 'tinted' | 'gray' | 'plain'; disabled?: boolean;
  icon?: IconName; label?: string; danger?: boolean; size?: 'large' | 'small';
}) {
  return <button type="button" className={['btn', kind, danger && 'danger', size].filter(Boolean).join(' ')}
    disabled={disabled} onClick={onClick} aria-label={label}>
    {icon && <Icon name={icon} size={20} />}{children}
  </button>;
}

export function Group({ header, footer, children, id }: { header?: ReactNode; footer?: ReactNode; children: ReactNode; id?: string }) {
  const headerId = useId();
  return <section className="group" aria-labelledby={header ? (id ?? headerId) : undefined}>
    {header && <h2 className="group-header" id={id ?? headerId}>{header}</h2>}
    <div className="group-body">{children}</div>
    {footer && <div className="group-footer">{footer}</div>}
  </section>;
}

/** A row in an inset grouped list: link, button, or static. */
export function Row({ title, detail, value, icon, href, onClick, chevron, checked, destructive, children, role }: {
  title: ReactNode; detail?: ReactNode; value?: ReactNode; icon?: IconName; href?: string; onClick?: () => void;
  chevron?: boolean; checked?: boolean; destructive?: boolean; children?: ReactNode; role?: string;
}) {
  const inner = <>
    {icon && <span className="row-icon"><Icon name={icon} size={22} /></span>}
    <span className="row-text">
      <span className="row-title">{title}</span>
      {detail && <span className="row-detail">{detail}</span>}
    </span>
    {value !== undefined && <span className="row-value">{value}</span>}
    {checked !== undefined && <span className="row-check" aria-hidden="true">{checked && <Icon name="check" size={20} weight={2.4} />}</span>}
    {(chevron || href) && <span className="chevron" aria-hidden="true"><Icon name="chevron" size={16} weight={2.4} /></span>}
    {children}
  </>;
  const cls = 'row' + (destructive ? ' destructive' : '') + (href || onClick ? ' pressable' : '');
  if (href) return <Link href={href} className={cls} data-navigates>{inner}</Link>;
  if (onClick) return <button type="button" className={cls} onClick={onClick} role={role}
    aria-checked={role === 'radio' ? !!checked : undefined}>{inner}</button>;
  return <div className={cls}>{inner}</div>;
}

export function Switch({ checked, onChange, title, detail }: { checked: boolean; onChange: (value: boolean) => void; title: string; detail?: string }) {
  const id = useId();
  return <label className="row switch-row" htmlFor={id}>
    <span className="row-text"><span className="row-title">{title}</span>{detail && <span className="row-detail" id={id + '-d'}>{detail}</span>}</span>
    <input id={id} type="checkbox" role="switch" checked={checked} aria-describedby={detail ? id + '-d' : undefined}
      onChange={e => onChange(e.target.checked)} />
  </label>;
}

export function Segmented<T extends string>({ values, selected, onChange, label, names }: {
  values: readonly T[]; selected: T; onChange: (v: T) => void; label: string; names?: Record<T, string>;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  function key(e: React.KeyboardEvent, index: number) {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const next = (index + step + values.length) % values.length;
    onChange(values[next]);
    refs.current[next]?.focus();
  }
  return <div className="segmented" role="radiogroup" aria-label={label}>
    {values.map((value, i) => <button key={value} ref={el => { refs.current[i] = el; }} type="button" role="radio"
      aria-checked={value === selected} tabIndex={value === selected ? 0 : -1}
      className={value === selected ? 'on' : ''} onClick={() => onChange(value)} onKeyDown={e => key(e, i)}>{names?.[value] ?? value}</button>)}
  </div>;
}

/** iOS action sheet on a native <dialog>: focus is trapped, Escape closes, focus returns to the trigger. */
export function ActionSheet({ open, title, message, actions, onClose }: {
  open: boolean; title?: string; message?: string; onClose: () => void;
  actions: { label: string; onSelect: () => void; destructive?: boolean; disabled?: boolean }[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    // Cancel is the safe default, as on iOS. Focus it after showModal, which picks the first button itself.
    if (open && !el.open) { el.showModal(); cancel.current?.focus(); }
    if (!open && el.open) el.close();
  }, [open]);
  const titleId = useId();
  return <dialog ref={dialog} className="action-sheet" aria-labelledby={title ? titleId : undefined} onClose={onClose}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="sheet-group">
      {(title || message) && <div className="sheet-head">
        {title && <h2 id={titleId}>{title}</h2>}{message && <p>{message}</p>}
      </div>}
      {actions.map(action => <button key={action.label} type="button" disabled={action.disabled}
        className={'sheet-action' + (action.destructive ? ' destructive' : '')} onClick={action.onSelect}>{action.label}</button>)}
    </div>
    <button ref={cancel} type="button" className="sheet-action cancel" onClick={onClose}>Cancel</button>
  </dialog>;
}

/** The round record control from Voice Memos: a red dot to record, a red square to stop. */
export function RecordButton({ state, onClick, disabled, label }: { state: 'record' | 'stop'; onClick: () => void; disabled?: boolean; label: string }) {
  return <button type="button" className={'record ' + state} onClick={onClick} disabled={disabled} aria-label={label}>
    <span className="record-glyph" aria-hidden="true" />
  </button>;
}

/** Live microphone level drawn as a scrolling waveform strip. Decorative for assistive tech. */
export function Waveform({ level, active }: { level: number; active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const history = useRef<number[]>([]);
  const current = useRef(0);
  current.current = active ? level : 0;
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    let frame = 0, last = 0;
    const draw = (time: number) => {
      frame = requestAnimationFrame(draw);
      if (time - last < 50) return; // 20 samples per second, like Voice Memos' strip
      last = time;
      const ratio = window.devicePixelRatio || 1;
      const width = el.clientWidth, height = el.clientHeight;
      if (el.width !== width * ratio) { el.width = width * ratio; el.height = height * ratio; }
      const bar = 3, gap = 3, count = Math.ceil(width / (bar + gap));
      history.current.push(Math.min(1, Math.sqrt(current.current) * 3.2));
      if (history.current.length > count) history.current.splice(0, history.current.length - count);
      const ctx = el.getContext('2d')!;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const style = getComputedStyle(el);
      const offset = count - history.current.length;
      history.current.forEach((value, i) => {
        const h = Math.max(3, value * (height - 4));
        const x = (offset + i) * (bar + gap);
        ctx.fillStyle = i >= history.current.length - 1 && active ? style.getPropertyValue('--wave-live') : style.color;
        ctx.globalAlpha = 0.35 + 0.65 * (i / history.current.length);
        ctx.beginPath();
        ctx.roundRect(x, (height - h) / 2, bar, h, 1.5);
        ctx.fill();
      });
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return <canvas ref={canvas} className={'waveform' + (active ? ' active' : '')} aria-hidden="true" />;
}

export function formatTime(ms: number) {
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : String(m)) + ':' + String(s).padStart(2, '0');
}
export function spokenTime(ms: number) {
  const sec = Math.floor(ms / 1000), m = Math.floor(sec / 60), s = sec % 60;
  return (m ? m + (m === 1 ? ' minute ' : ' minutes ') : '') + s + (s === 1 ? ' second' : ' seconds');
}
export const formatDate = (time: number) => new Date(time).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
