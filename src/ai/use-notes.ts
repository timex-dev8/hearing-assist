import { useRef, useState } from 'react';
import type { Notes, Session } from '../types';
import { saveNotes } from '../storage/notebook';
import { makeNotes } from './client';

export type NoteJob = { busy: boolean; error?: string };
/** Notes keep generating while the user moves around the site. */
export function useNotes(onSaved: (id: string, notes: Notes) => void) {
  const active = useRef(new Set<string>());
  const [jobs, setJobs] = useState<Record<string, NoteJob>>({});
  async function generate(session: Session) {
    if (active.current.has(session.id)) return;
    active.current.add(session.id);
    const update = (job: NoteJob) => setJobs(previous => ({ ...previous, [session.id]: job }));
    update({ busy: true });
    try {
      const notes = await makeNotes(session);
      if (await saveNotes(session.id, notes)) onSaved(session.id, notes);
      update({ busy: false });
    } catch (e) {
      update({ busy: false, error: e instanceof Error ? e.message : 'Unable to save generated notes. Please retry.' });
    } finally { active.current.delete(session.id); }
  }
  return { jobs, generate };
}
