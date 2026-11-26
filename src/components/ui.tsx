import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Link } from 'wouter';
import {
  ArrowDownIcon, ArrowLeftIcon, ArrowUUpLeftIcon, ArrowUUpRightIcon, ArrowUpIcon, BookmarkSimpleIcon, CardsIcon, CaretRightIcon,
  ChatsCircleIcon, CheckIcon, CopyIcon, DotsThreeIcon, ExportIcon, FileDocIcon, GearIcon, HighlighterIcon, HouseIcon, ListBulletsIcon,
  ListChecksIcon, ListNumbersIcon, LockIcon, MagnifyingGlassIcon, MicrophoneIcon, NotebookIcon, PaperPlaneRightIcon, PlusIcon,
  PresentationChartIcon, PrinterIcon, QuotesIcon, SparkleIcon, StudentIcon, TextAaIcon, TextBIcon, TextHOneIcon, TextHTwoIcon,
  TextItalicIcon, TrashIcon, UsersThreeIcon, WarningIcon, XIcon, type Icon as PhosphorIcon,
} from '@phosphor-icons/react';

const icons = {
  home: HouseIcon, notes: NotebookIcon, study: CardsIcon, settings: GearIcon, mic: MicrophoneIcon, back: ArrowLeftIcon,
  chevron: CaretRightIcon, check: CheckIcon, lecture: StudentIcon, presentation: PresentationChartIcon, meeting: UsersThreeIcon,
  seminar: ChatsCircleIcon, mark: BookmarkSimpleIcon, sparkle: SparkleIcon, textformat: TextAaIcon, down: ArrowDownIcon, up: ArrowUpIcon,
  quote: QuotesIcon, search: MagnifyingGlassIcon, trash: TrashIcon, copy: CopyIcon, docx: FileDocIcon, print: PrinterIcon,
  export: ExportIcon, more: DotsThreeIcon, send: PaperPlaneRightIcon, plus: PlusIcon, alert: WarningIcon, lock: LockIcon, close: XIcon,
  bold: TextBIcon, italic: TextItalicIcon, highlight: HighlighterIcon, h1: TextHOneIcon, h2: TextHTwoIcon, bullets: ListBulletsIcon,
  numbers: ListNumbersIcon, tasks: ListChecksIcon, undo: ArrowUUpLeftIcon, redo: ArrowUUpRightIcon,
} satisfies Record<string, PhosphorIcon>;
export type IconName = keyof typeof icons;

/** Phosphor icons: regular weight, fill for the current place. Always decorative; the control carries the name. */
export function Icon({ name, size = 22, fill, bold }: { name: IconName; size?: number; fill?: boolean; bold?: boolean }) {
  const Glyph = icons[name];
  return <Glyph className="icon" size={size} weight={fill ? 'fill' : bold ? 'bold' : 'regular'} aria-hidden="true" focusable="false" />;
}

type ButtonProps = {
  children?: ReactNode; onClick?: () => void; href?: string; kind?: 'primary' | 'secondary' | 'quiet' | 'danger';
  size?: 'lg' | 'md' | 'sm'; icon?: IconName; disabled?: boolean; label?: string; type?: 'button' | 'submit'; className?: string;
};
export function Button({ children, onClick, href, kind = 'primary', size = 'md', icon, disabled, label, type = 'button', className = '' }: ButtonProps) {
  const cls = ['btn', kind, size, !children && 'icon-only', className].filter(Boolean).join(' ');
  const body = <>{icon && <Icon name={icon} size={size === 'sm' ? 18 : 20} bold={kind === 'primary'} />}{children && <span>{children}</span>}</>;
  if (href && !disabled) return <Link href={href} className={cls} aria-label={label} data-navigates>{body}</Link>;
  return <button type={type} className={cls} onClick={onClick} disabled={disabled} aria-label={label}>{body}</button>;
}

export function Switch({ checked, onChange, title, detail, icon }: {
  checked: boolean; onChange: (value: boolean) => void; title: string; detail?: string; icon?: IconName;
}) {
  const id = useId();
  return <label className={'switch-row' + (checked ? ' on' : '')} htmlFor={id}>
    {icon && <span className="row-icon"><Icon name={icon} /></span>}
    <span className="row-text"><span className="row-title">{title}</span>{detail && <span className="row-detail" id={id + '-d'}>{detail}</span>}</span>
    <input id={id} type="checkbox" role="switch" checked={checked} aria-describedby={detail ? id + '-d' : undefined}
      onChange={e => onChange(e.target.checked)} />
  </label>;
}

/** Keyboard roving for radio groups and tab lists: arrows move and select, Home/End jump. */
function useRoving<T>(values: readonly T[], onChange: (v: T) => void) {
  const refs = useRef<(HTMLElement | null)[]>([]);
  return {
    refs,
    onKeyDown(e: React.KeyboardEvent, index: number) {
      const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      let next = -1;
      if (e.key in keys) next = (index + keys[e.key] + values.length) % values.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = values.length - 1;
      if (next < 0) return;
      e.preventDefault();
      onChange(values[next]);
      refs.current[next]?.focus();
    },
  };
}

/** A single-choice group drawn as chips or cards. Selection shows a check, never color alone. */
export function Choice<T extends string>({ values, selected, onChange, label, names, details, icons: glyphs, classes, variant = 'chips', labelledBy }: {
  values: readonly T[]; selected: T; onChange: (v: T) => void; label?: string; labelledBy?: string; names?: Partial<Record<T, string>>;
  details?: Partial<Record<T, string>>; icons?: Partial<Record<T, IconName>>; classes?: Partial<Record<T, string>>; variant?: 'chips' | 'cards' | 'segmented';
}) {
  const id = useId();
  const { refs, onKeyDown } = useRoving(values, onChange);
  return <div className={'choice ' + variant} role="radiogroup" aria-label={labelledBy ? undefined : label} aria-labelledby={labelledBy}>
    {values.map((value, i) => {
      const on = value === selected;
      return <button key={value} ref={el => { refs.current[i] = el; }} type="button" role="radio" aria-checked={on} tabIndex={on ? 0 : -1}
        aria-describedby={details?.[value] ? id + i : undefined}
        className={['chip', on && 'on', classes?.[value]].filter(Boolean).join(' ')} onClick={() => onChange(value)} onKeyDown={e => onKeyDown(e, i)}>
        {glyphs?.[value] && <span className="chip-icon"><Icon name={glyphs[value]!} size={variant === 'cards' ? 26 : 20} fill={on && variant !== 'cards'} /></span>}
        <span className="chip-text">
          <span className="chip-name">{names?.[value] ?? value}</span>
          {details?.[value] && <span className="chip-detail" id={id + i}>{details[value]}</span>}
        </span>
        {variant !== 'segmented' && <span className="chip-check" aria-hidden="true">{on && <Icon name="check" size={16} bold />}</span>}
      </button>;
    })}
  </div>;
}

/** Tabs with real tab semantics. Panels use tabPanelProps(base, value). */
export function Tabs<T extends string>({ values, selected, onChange, label, base, names, counts }: {
  values: readonly T[]; selected: T; onChange: (v: T) => void; label: string; base: string;
  names?: Partial<Record<T, string>>; counts?: Partial<Record<T, number>>;
}) {
  const { refs, onKeyDown } = useRoving(values, onChange);
  return <div className="tabs" role="tablist" aria-label={label}>
    {values.map((value, i) => <button key={value} ref={el => { refs.current[i] = el; }} type="button" role="tab" id={base + '-tab-' + value}
      aria-controls={base + '-panel-' + value} aria-selected={value === selected} tabIndex={value === selected ? 0 : -1}
      className={value === selected ? 'on' : ''} onClick={() => onChange(value)} onKeyDown={e => onKeyDown(e, i)}>
      {names?.[value] ?? value}{counts?.[value] ? <span className="tab-count">{counts[value]}</span> : null}
    </button>)}
  </div>;
}
export const tabPanelProps = (base: string, value: string) =>
  ({ role: 'tabpanel', id: base + '-panel-' + value, 'aria-labelledby': base + '-tab-' + value, tabIndex: 0 } as const);

export function Banner({ children, tone = 'error' }: { children: ReactNode; tone?: 'error' | 'info' }) {
  return <p className={'banner ' + tone} role={tone === 'error' ? 'alert' : 'status'}>
    <Icon name={tone === 'error' ? 'alert' : 'sparkle'} size={20} /><span>{children}</span>
  </p>;
}

export function Spinner() { return <span className="spinner" aria-hidden="true" />; }

export type SheetAction = { label: string; onSelect: () => void; icon?: IconName; destructive?: boolean; disabled?: boolean; detail?: string };
/** A list of actions on a native modal <dialog>: focus is trapped, Escape closes, focus returns to the trigger. */
export function ActionSheet({ open, title, message, actions, onClose }: {
  open: boolean; title?: string; message?: string; onClose: () => void; actions: SheetAction[];
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  // A sheet closed because its parent said so (say, to open the next sheet) must not report back and undo that.
  const shown = useRef(open);
  shown.current = open;
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) { el.showModal(); cancel.current?.focus(); }
    if (!open && el.open) el.close();
  }, [open]);
  return <dialog ref={dialog} className="sheet" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : 'Actions'} onClose={() => { if (shown.current) onClose(); }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="sheet-card">
      {(title || message) && <div className="sheet-head">
        {title && <h2 id={titleId}>{title}</h2>}{message && <p>{message}</p>}
      </div>}
      <div className="sheet-actions">
        {actions.map(action => <button key={action.label} type="button" disabled={action.disabled}
          className={'sheet-action' + (action.destructive ? ' destructive' : '')} onClick={action.onSelect}>
          {action.icon && <Icon name={action.icon} />}
          <span className="sheet-action-text"><span>{action.label}</span>{action.detail && <span className="sheet-action-detail">{action.detail}</span>}</span>
        </button>)}
      </div>
      <button ref={cancel} type="button" className="sheet-cancel" onClick={onClose}>Cancel</button>
    </div>
  </dialog>;
}

/** The round record control: a red dot to record, a red square to stop. */
export function RecordButton({ state, onClick, disabled, label, size = 'lg' }: {
  state: 'record' | 'stop'; onClick: () => void; disabled?: boolean; label: string; size?: 'lg' | 'md';
}) {
  return <button type="button" className={'record-btn ' + state + ' ' + size} onClick={onClick} disabled={disabled} aria-label={label}>
    <span className="record-glyph" aria-hidden="true" />
  </button>;
}

/** Live microphone level drawn as a scrolling strip. Decorative for assistive tech: the status text carries the state. */
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
      if (time - last < 50) return;
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
        ctx.fillStyle = i >= history.current.length - 1 && active ? style.getPropertyValue('--wave-live') : style.color;
        ctx.globalAlpha = 0.3 + 0.7 * (i / history.current.length);
        ctx.beginPath();
        ctx.roundRect((offset + i) * (bar + gap), (height - h) / 2, bar, h, 1.5);
        ctx.fill();
      });
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return <canvas ref={canvas} className={'waveform' + (active ? ' active' : '')} aria-hidden="true" />;
}

export { formatDate, formatTime, spokenTime } from '../util/time';
