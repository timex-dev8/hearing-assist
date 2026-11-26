import { AlignmentType, Document, HeadingLevel, LevelFormat, Packer, Paragraph, TextRun } from 'docx';
import type { Block } from './doc';

const headings = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4];
const font = 'Atkinson Hyperlegible Next';

/** Builds a Word document from flattened blocks. Opens in Word, Pages and Google Docs. */
export async function blocksToDocx(blocks: Block[], title: string): Promise<Blob> {
  const levels = (format: (typeof LevelFormat)[keyof typeof LevelFormat], text: (i: number) => string) =>
    Array.from({ length: 6 }, (_, i) => ({ level: i, format, text: text(i), alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 720 * (i + 1), hanging: 360 } } } }));
  const paragraphs = [new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(title)] }), ...blocks.map(block => {
    const children = block.runs.map(r => new TextRun({ text: r.text, bold: r.bold, italics: r.italic, strike: r.strike,
      underline: r.underline ? {} : undefined, highlight: r.highlight ? 'yellow' : undefined, color: r.source ? '5B6762' : undefined, size: r.source ? 18 : undefined }));
    switch (block.kind) {
      case 'heading': return new Paragraph({ heading: headings[Math.min(3, block.level - 1)] ?? HeadingLevel.HEADING_2, children });
      case 'bullet': return new Paragraph({ numbering: { reference: 'bullets', level: block.level }, children });
      case 'number': return new Paragraph({ numbering: { reference: 'numbers', level: block.level }, children });
      case 'task': return new Paragraph({ indent: { left: 360 * (block.level + 1) }, children: [new TextRun(block.checked ? '☑ ' : '☐ '), ...children] });
      case 'quote': return new Paragraph({ indent: { left: 720 }, children: children.length ? children : [new TextRun('')] });
      case 'rule': return new Paragraph({ border: { bottom: { color: 'C3CCC8', space: 1, style: 'single', size: 6 } }, children: [] });
      default: return new Paragraph({ indent: block.level ? { left: 720 * block.level } : undefined, children });
    }
  })];
  const doc = new Document({
    creator: 'Hearing Assist', title,
    styles: { default: { document: { run: { font, size: 24 } } } },
    numbering: { config: [
      { reference: 'bullets', levels: levels(LevelFormat.BULLET, i => ['•', '◦', '▪'][i % 3]) },
      { reference: 'numbers', levels: levels(LevelFormat.DECIMAL, i => '%' + (i + 1) + '.') },
    ] },
    sections: [{ children: paragraphs }],
  });
  return Packer.toBlob(doc);
}
