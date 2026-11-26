import type { Kind, Mode } from '../shared/modes';
export type { Kind, Mode };
export type Caption = { text: string; at: number }; // milliseconds from session start
export type NoteItem = { text: string; detail?: string; quote: string; marked?: true };
/** `id` and `kind` are missing on notes saved by the first version. */
export type NoteSection = { id?: string; heading: string; kind?: Kind; items: NoteItem[] };
export type Notes = { version?: 2; mode?: Mode; summary: string; sections: NoteSection[] };
export type Answer = { answer: string; quote: string | null };
/** A TipTap/ProseMirror JSON node. */
export type DocMark = { type: string; attrs?: Record<string, unknown> };
export type DocNode = { type: string; attrs?: Record<string, any>; content?: DocNode[]; text?: string; marks?: DocMark[] };
export type Session = {
  id: string;
  title: string;
  mode: Mode;
  startedAt: number;
  durationMs: number;
  captions: Caption[];
  allowAI: boolean;
  notes?: Notes;       // what the AI wrote, kept for study cards and regeneration
  doc?: DocNode;       // the student's editable notes document
  docEditedAt?: number;
  marks?: number[];    // moments the student marked while listening, ms from start
};
