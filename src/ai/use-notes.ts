import { useRef, useState } from 'react';
import type { Session } from '../types';
import type { Store } from '../storage/store';
import { notesToDoc } from '../notes/doc';
import { makeNotes } from './client';

export type NoteJob = { busy: boolean; error?: string };
/** Notes keep generating while the student moves around the app. */
export function useNotes(store: Store, onSaved: (session: Session) => void) {
  const active = useRef(new Set<string>());
  const [jobs, setJobs] = useState<Record<string, NoteJob>>({});
  async function generate(session: Session, replaceDoc = false) {
    if (active.current.has(session.id)) return;
    active.current.add(session.id);
    const update = (job: NoteJob) => setJobs(previous => ({ ...previous, [session.id]: job }));
    update({ busy: true });
    try {
      const notes = await makeNotes(session);
      const saved = await store.attachNotes(session.id, notes, notesToDoc(notes, session.captions), { replaceDoc });
      if (saved) onSaved(saved);
      update({ busy: false });
    } catch (e) {
      update({ busy: false, error: e instanceof Error ? e.message : 'Couldn’t save the notes. Try again.' });
    } finally { active.current.delete(session.id); }
  }
  return { jobs, generate };
}
