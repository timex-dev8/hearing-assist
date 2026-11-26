import { createStore, del, entries, get, set } from 'idb-keyval';
import { defaults, legacySize, type Preferences } from '../settings/caption-style';
import type { Store } from './store';
import type { Session } from '../types';

/** Sessions, preferences and study progress in this browser's IndexedDB. */
export function localStore(): Store {
  const sessions = createStore('hearing-assist', 'sessions');
  const preferences = createStore('hearing-assist-preferences', 'preferences');
  const study = createStore('hearing-assist-study', 'progress');
  return {
    async list() {
      const rows = await entries<string, Session>(sessions);
      return rows.map(([, s]) => s).sort((a, b) => b.startedAt - a.startedAt);
    },
    save: session => set(session.id, session, sessions),
    remove: id => del(id, sessions),
    async attachNotes(id, notes, doc, { replaceDoc = false } = {}) {
      const current = await get<Session>(id, sessions);
      if (!current?.allowAI) return undefined;
      const next: Session = { ...current, notes, ...(replaceDoc || !current.doc || !current.docEditedAt ? { doc, docEditedAt: undefined } : {}) };
      await set(id, next, sessions);
      return next;
    },
    async loadPreferences(): Promise<Preferences> {
      const saved = await get<Partial<Preferences>>('prefs', preferences);
      if (saved) return { ...defaults, ...saved };
      const size = await get<number>('size', preferences); // the first version saved one caption size
      return size === undefined ? defaults : { ...defaults, preset: 'custom', size: legacySize(size) };
    },
    savePreferences: prefs => set('prefs', prefs, preferences),
    loadProgress: async () => (await get('progress', study)) ?? {},
    saveProgress: progress => set('progress', progress, study),
    keep() { void navigator.storage?.persist?.().catch(() => false); },
  };
}
