import { createStore, del, entries, get, set } from 'idb-keyval';
import type { Notes, Session } from '../types';
import { defaults, legacySize, type Preferences } from '../settings/caption-style';

const sessions = createStore('hearing-assist', 'sessions');
const preferences = createStore('hearing-assist-preferences', 'preferences');

export async function loadSessions(): Promise<Session[]> {
  const rows = await entries<string, Session>(sessions);
  return rows.map(([, session]) => session).sort((a, b) => b.startedAt - a.startedAt);
}
export async function saveSession(session: Session) {
  await set(session.id, session, sessions);
}
export async function deleteSession(id: string) {
  await del(id, sessions);
}
/** Attach notes only if the session still exists and still allows AI. */
export async function saveNotes(id: string, notes: Notes) {
  const current = await get<Session>(id, sessions);
  if (!current?.allowAI) return false;
  await set(id, { ...current, notes }, sessions);
  return true;
}
/** Reader preferences. Migrates the single caption size saved by the first version. */
export async function loadPreferences(): Promise<Preferences> {
  const saved = await get<Partial<Preferences>>('prefs', preferences);
  if (saved) return { ...defaults, ...saved };
  const size = await get<number>('size', preferences);
  return size === undefined ? defaults : { ...defaults, preset: 'custom', size: legacySize(size) };
}
export async function savePreferences(prefs: Preferences) {
  await set('prefs', prefs, preferences);
}
/** Ask the browser not to clear saved sessions when storage is low. */
export function keepData() {
  void navigator.storage?.persist?.().catch(() => false);
}
