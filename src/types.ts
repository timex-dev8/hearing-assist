export type Mode = 'Lecture' | 'Meeting';
export type Caption = { text: string; at: number }; // milliseconds from session start
export type NoteSection = { heading: string; items: { text: string; quote: string }[] };
export type Notes = { summary: string; sections: NoteSection[] };
export type Answer = { answer: string; quote: string | null };
export type Session = {
  id: string;
  title: string;
  mode: Mode;
  startedAt: number;
  durationMs: number;
  captions: Caption[];
  allowAI: boolean;
  notes?: Notes;
};
