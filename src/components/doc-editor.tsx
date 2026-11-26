import { useEffect, useRef } from 'react';
import { EditorContent, Node, mergeAttributes, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Placeholder } from '@tiptap/extensions';
import { Icon, type IconName } from './ui';
import { formatTime } from '../util/time';
import type { DocNode } from '../types';

/** A link back to the moment in the transcript a note came from. */
const Source = Node.create({
  name: 'source', group: 'inline', inline: true, atom: true, selectable: false,
  addAttributes: () => ({ quote: { default: '', rendered: false }, at: { default: null, rendered: false } }),
  parseHTML: () => [{ tag: 'span[data-source]', getAttrs: el => ({ quote: (el as HTMLElement).dataset.quote ?? '', at: (el as HTMLElement).dataset.at ? Number((el as HTMLElement).dataset.at) : null }) }],
  renderHTML({ node, HTMLAttributes }) {
    const at = node.attrs.at as number | null;
    return ['span', mergeAttributes(HTMLAttributes, {
      'data-source': '', 'data-quote': node.attrs.quote, 'data-at': at ?? '', class: 'src', contenteditable: 'false', role: 'button', tabindex: '0',
      // The visible time leads the name (WCAG 2.5.3), so voice control users can say what they see.
      'aria-label': at != null ? formatTime(at) + ', show in transcript' : 'Source', title: '“' + node.attrs.quote + '”',
    }), at != null ? formatTime(at) : 'Source'];
  },
});

type Tool = { name: string; icon: IconName; run: (e: Editor) => void; active?: (e: Editor) => boolean; can?: (e: Editor) => boolean; gap?: boolean };
const tools: Tool[] = [
  { name: 'Heading', icon: 'h1', run: e => e.chain().focus().toggleHeading({ level: 2 }).run(), active: e => e.isActive('heading', { level: 2 }) },
  { name: 'Subheading', icon: 'h2', run: e => e.chain().focus().toggleHeading({ level: 3 }).run(), active: e => e.isActive('heading', { level: 3 }) },
  { name: 'Bold', icon: 'bold', run: e => e.chain().focus().toggleBold().run(), active: e => e.isActive('bold'), gap: true },
  { name: 'Italic', icon: 'italic', run: e => e.chain().focus().toggleItalic().run(), active: e => e.isActive('italic') },
  { name: 'Highlight', icon: 'highlight', run: e => e.chain().focus().toggleHighlight().run(), active: e => e.isActive('highlight') },
  { name: 'Bulleted list', icon: 'bullets', run: e => e.chain().focus().toggleBulletList().run(), active: e => e.isActive('bulletList'), gap: true },
  { name: 'Numbered list', icon: 'numbers', run: e => e.chain().focus().toggleOrderedList().run(), active: e => e.isActive('orderedList') },
  { name: 'Checklist', icon: 'tasks', run: e => e.chain().focus().toggleTaskList().run(), active: e => e.isActive('taskList') },
  { name: 'Quote', icon: 'quote', run: e => e.chain().focus().toggleBlockquote().run(), active: e => e.isActive('blockquote') },
  { name: 'Undo', icon: 'undo', run: e => e.chain().focus().undo().run(), can: e => e.can().undo(), gap: true },
  { name: 'Redo', icon: 'redo', run: e => e.chain().focus().redo().run(), can: e => e.can().redo() },
];

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({ editor, selector: ({ editor: e }) => tools.map(t => ({ on: t.active?.(e) ?? false, can: t.can?.(e) ?? true })) });
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = useRef(0);
  // One tab stop for the whole toolbar; arrows move between buttons (WAI-ARIA toolbar pattern).
  function key(e: React.KeyboardEvent) {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!step && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    current.current = e.key === 'Home' ? 0 : e.key === 'End' ? tools.length - 1 : (current.current + step + tools.length) % tools.length;
    refs.current.forEach((b, i) => b?.setAttribute('tabindex', i === current.current ? '0' : '-1'));
    refs.current[current.current]?.focus();
  }
  return <div className="doc-toolbar" role="toolbar" aria-label="Formatting" onKeyDown={key}>
    {tools.map((t, i) => <button key={t.name} ref={el => { refs.current[i] = el; }} type="button" tabIndex={i === 0 ? 0 : -1}
      className={'tool' + (t.gap ? ' gap' : '') + (state[i].on ? ' on' : '')} aria-label={t.name} title={t.name}
      aria-pressed={t.active ? state[i].on : undefined} disabled={!state[i].can}
      onMouseDown={e => e.preventDefault()} onClick={() => { current.current = i; t.run(editor); }}>
      <Icon name={t.icon} size={20} bold={state[i].on} />
    </button>)}
  </div>;
}

/** The student's notes: a formatted document like Google Docs, saved as they type. */
export default function DocEditor({ doc, label, onChange, onSource }: {
  doc: DocNode; label: string; onChange: (doc: DocNode) => void; onSource: (at: number | null, quote: string) => void;
}) {
  const timer = useRef(0);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: { openOnClick: false, autolink: true, protocols: ['https', 'mailto'] } }),
      Highlight, TaskList, TaskItem.configure({ nested: true }), Source,
      Placeholder.configure({ placeholder: 'Start typing your notes…' }),
    ],
    content: doc,
    editorProps: { attributes: { class: 'doc-body', role: 'textbox', 'aria-multiline': 'true', 'aria-label': label, spellcheck: 'true' } },
    onUpdate: ({ editor: e }) => {
      clearTimeout(timer.current);
      timer.current = window.setTimeout(() => onChange(e.getJSON() as DocNode), 500);
    },
  });
  // Save what was typed if the student leaves within the debounce window.
  useEffect(() => () => { if (timer.current && editor) { clearTimeout(timer.current); onChange(editor.getJSON() as DocNode); } }, [editor]);
  function source(target: EventTarget) {
    const el = (target as HTMLElement).closest?.('[data-source]') as HTMLElement | null;
    if (!el) return false;
    onSource(el.dataset.at ? Number(el.dataset.at) : null, el.dataset.quote ?? '');
    return true;
  }
  if (!editor) return null;
  return <div className="doc-editor">
    <Toolbar editor={editor} />
    <EditorContent editor={editor} onClick={e => { if (source(e.target)) e.preventDefault(); }}
      onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && source(e.target)) e.preventDefault(); }} />
  </div>;
}
