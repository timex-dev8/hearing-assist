import type { Caption, DocMark, DocNode, Kind, Notes } from '../types';
import { formatTime } from '../util/time';

const txt = (text: string, marks?: DocMark[]): DocNode => (marks?.length ? { type: 'text', text, marks } : { type: 'text', text });
const para = (...content: DocNode[]): DocNode => (content.length ? { type: 'paragraph', content } : { type: 'paragraph' });
const listItem = (...content: DocNode[]): DocNode => ({ type: 'listItem', content });

export const blankDoc = (): DocNode => ({ type: 'doc', content: [{ type: 'paragraph' }] });

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
/** When was this quote said? Matches the caption that contains it, or the first caption it contains. */
export function findTime(quote: string, captions: Caption[]): number | null {
  const q = norm(quote);
  if (!q) return null;
  const hit = captions.find(c => norm(c.text).includes(q)) ?? captions.find(c => { const t = norm(c.text); return t.length > 8 && q.includes(t); })
    ?? captions.find(c => norm(c.text).includes(q.slice(0, 40)));
  return hit ? hit.at : null;
}

/** Turns AI notes into the student's editable document. */
export function notesToDoc(notes: Notes, captions: Caption[]): DocNode {
  const content: DocNode[] = [];
  for (const section of notes.sections) {
    if (!section.items.length) continue;
    const kind: Kind = section.kind ?? (/summary/i.test(section.heading) ? 'text' : 'point');
    content.push({ type: 'heading', attrs: { level: 2 }, content: [txt(section.heading)] });
    const source = (quote: string): DocNode => ({ type: 'source', attrs: { quote, at: findTime(quote, captions) } });
    const main = (text: string, marked?: boolean, bold?: boolean) =>
      txt(text, [...(bold ? [{ type: 'bold' }] : []), ...(marked ? [{ type: 'highlight' }] : [])]);
    const items = section.items.map(item => {
      const m = !!item.marked;
      switch (kind) {
        case 'text': return para(main(item.text, m), source(item.quote));
        case 'term': return listItem(para(main(item.text, m, true), txt(' — ' + (item.detail ?? '')), source(item.quote)));
        case 'qa': return listItem(para(main(item.text, m, true), source(item.quote)), para(txt(item.detail ?? '')));
        case 'task': return { type: 'taskItem', attrs: { checked: false }, content: [para(main(item.text, m), ...(item.detail ? [txt(' — ' + item.detail)] : []), source(item.quote))] };
        case 'point': return listItem(para(main(item.text, m), source(item.quote)), ...(item.detail ? [para(txt(item.detail, [{ type: 'italic' }]))] : []));
        default: return listItem(para(main(item.text, m), source(item.quote)));
      }
    });
    if (kind === 'text') content.push(...items);
    else content.push({ type: kind === 'task' ? 'taskList' : kind === 'qa' ? 'orderedList' : 'bulletList', content: items });
  }
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] };
}

/* ---------- Plain text ---------- */
const inline = (node: DocNode): string => node.type === 'text' ? node.text ?? ''
  : node.type === 'hardBreak' ? '\n'
  : node.type === 'source' ? (node.attrs?.at != null ? ' [' + formatTime(node.attrs.at) + ']' : '')
  : (node.content ?? []).map(inline).join('');

/** Flattened blocks: what Word, plain text and print all need. */
export type Run = { text: string; bold?: boolean; italic?: boolean; highlight?: boolean; strike?: boolean; underline?: boolean; source?: boolean };
export type Block = { kind: 'heading' | 'para' | 'bullet' | 'number' | 'task' | 'quote' | 'rule'; level: number; runs: Run[]; checked?: boolean };

function runs(nodes: DocNode[] = []): Run[] {
  return nodes.flatMap((node): Run[] => {
    if (node.type === 'text') {
      const has = (t: string) => node.marks?.some(m => m.type === t) || undefined;
      return [{ text: node.text ?? '', bold: has('bold'), italic: has('italic'), highlight: has('highlight'), strike: has('strike'), underline: has('underline') }];
    }
    if (node.type === 'hardBreak') return [{ text: '\n' }];
    if (node.type === 'source') return node.attrs?.at != null ? [{ text: ' [' + formatTime(node.attrs.at) + ']', source: true }] : [];
    return runs(node.content);
  });
}

export function docToBlocks(doc: DocNode): Block[] {
  const out: Block[] = [];
  const walk = (nodes: DocNode[] = [], list?: { kind: 'bullet' | 'number' | 'task'; level: number }, quote = false) => {
    for (const node of nodes) {
      switch (node.type) {
        case 'heading': out.push({ kind: 'heading', level: node.attrs?.level ?? 2, runs: runs(node.content) }); break;
        case 'paragraph': out.push({ kind: quote ? 'quote' : 'para', level: 0, runs: runs(node.content) }); break;
        case 'horizontalRule': out.push({ kind: 'rule', level: 0, runs: [] }); break;
        case 'blockquote': walk(node.content, list, true); break;
        case 'bulletList': case 'orderedList': case 'taskList': {
          const kind = node.type === 'bulletList' ? 'bullet' : node.type === 'orderedList' ? 'number' : 'task';
          walk(node.content, { kind, level: list ? list.level + 1 : 0 }); break;
        }
        case 'listItem': case 'taskItem': {
          const [first, ...rest] = node.content ?? [];
          out.push({ kind: list?.kind ?? 'bullet', level: list?.level ?? 0, runs: first?.type === 'paragraph' ? runs(first.content) : [],
            ...(node.type === 'taskItem' ? { checked: !!node.attrs?.checked } : {}) });
          // Following paragraphs of the same item continue it; nested lists go one level deeper.
          for (const child of first?.type === 'paragraph' ? rest : node.content ?? []) {
            if (child.type === 'paragraph') out.push({ kind: 'para', level: (list?.level ?? 0) + 1, runs: runs(child.content) });
            else walk([child], list);
          }
          break;
        }
        default: walk(node.content, list, quote);
      }
    }
  };
  walk(doc.content);
  return out;
}

export function docToText(doc: DocNode): string {
  let n = 0;
  return docToBlocks(doc).map(b => {
    const t = b.runs.map(r => r.text).join('');
    const pad = '  '.repeat(b.level);
    if (b.kind !== 'number') n = 0;
    switch (b.kind) {
      case 'heading': return '\n' + t;
      case 'bullet': return pad + '• ' + t;
      case 'number': return pad + (++n) + '. ' + t;
      case 'task': return pad + (b.checked ? '☑ ' : '☐ ') + t;
      case 'quote': return '> ' + t;
      case 'rule': return '———';
      default: return pad + t;
    }
  }).join('\n').trim();
}

/* ---------- HTML (clipboard for Google Docs, print) ---------- */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const safeHref = (href: unknown) => typeof href === 'string' && /^(https?:|mailto:)/i.test(href) ? href : null;
const tags: Record<string, string> = { bold: 'strong', italic: 'em', highlight: 'mark', strike: 's', underline: 'u', code: 'code' };

function html(node: DocNode): string {
  const kids = () => (node.content ?? []).map(html).join('');
  switch (node.type) {
    case 'text': {
      let out = esc(node.text ?? '').replace(/\n/g, '<br>');
      for (const mark of node.marks ?? []) {
        if (mark.type === 'link') { const href = safeHref(mark.attrs?.href); if (href) out = '<a href="' + esc(href) + '">' + out + '</a>'; }
        else if (tags[mark.type]) out = '<' + tags[mark.type] + '>' + out + '</' + tags[mark.type] + '>';
      }
      return out;
    }
    case 'source': return node.attrs?.at != null ? ' <span style="color:#5b6762">[' + formatTime(node.attrs.at) + ']</span>' : '';
    case 'hardBreak': return '<br>';
    case 'paragraph': return '<p>' + kids() + '</p>';
    case 'heading': { const l = Math.min(6, Math.max(1, Number(node.attrs?.level) || 2)); return '<h' + l + '>' + kids() + '</h' + l + '>'; }
    case 'bulletList': return '<ul>' + kids() + '</ul>';
    case 'orderedList': return '<ol>' + kids() + '</ol>';
    case 'taskList': return '<ul style="list-style:none;padding-left:0">' + kids() + '</ul>';
    case 'listItem': return '<li>' + kids() + '</li>';
    case 'taskItem': return '<li>' + kids().replace(/^<p>/, '<p>' + (node.attrs?.checked ? '☑ ' : '☐ ')) + '</li>';
    case 'blockquote': return '<blockquote>' + kids() + '</blockquote>';
    case 'horizontalRule': return '<hr>';
    default: return kids();
  }
}

export function docToHtml(doc: DocNode, title?: string) {
  return (title ? '<h1>' + esc(title) + '</h1>' : '') + html(doc);
}
