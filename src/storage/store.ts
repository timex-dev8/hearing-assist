import type { DocNode, Notes, Session } from '../types';
import type { Preferences } from '../settings/caption-style';
import type { Progress } from '../study/cards';

/**
 * Everything the app saves goes through this interface. Today it is the browser (local.ts);
 * a Supabase implementation can replace it later without touching the screens.
 */
export interface Store {
  list(): Promise<Session[]>;
  save(session: Session): Promise<void>;
  remove(id: string): Promise<void>;
  /** Attach finished notes to a session that still exists and still allows AI. The doc is set only if the
   *  student hasn't edited theirs, unless replaceDoc. Returns the updated session, or undefined. */
  attachNotes(id: string, notes: Notes, doc: DocNode, options?: { replaceDoc?: boolean }): Promise<Session | undefined>;
  loadPreferences(): Promise<Preferences>;
  savePreferences(prefs: Preferences): Promise<void>;
  loadProgress(): Promise<Progress>;
  saveProgress(progress: Progress): Promise<void>;
  /** Ask for durable storage so the browser doesn't clear sessions when space is low. */
  keep(): void;
}
