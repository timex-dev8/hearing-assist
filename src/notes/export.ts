import { docToBlocks, docToHtml, docToText } from './doc';
import type { DocNode } from '../types';

/** Copies formatted notes: pasting into Google Docs, Word or Notes keeps headings, lists and bold. */
export async function copyRich(doc: DocNode, title: string) {
  const html = docToHtml(doc, title), text = title + '\n\n' + docToText(doc);
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([text], { type: 'text/plain' }) })]);
  } else await navigator.clipboard.writeText(text);
}

const fileName = (title: string, ext: string) => (title.replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'Notes') + '.' + ext;
function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** A Word file. The docx library loads only when someone asks for one. */
export async function downloadDocx(doc: DocNode, title: string) {
  const { blocksToDocx } = await import('./to-docx');
  download(await blocksToDocx(docToBlocks(doc), title), fileName(title, 'docx'));
}
export function downloadText(text: string, title: string) {
  download(new Blob([text], { type: 'text/plain;charset=utf-8' }), fileName(title, 'txt'));
}
