import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { loadPreferences, savePreferences } from '../storage/notebook';
import { captionVars, defaults, resolveCaption, type Preferences } from './caption-style';

type Value = { prefs: Preferences; update: (change: Partial<Preferences>) => void; error: string };
const PreferencesContext = createContext<Value>({ prefs: defaults, update: () => {}, error: '' });

/** Loads reader preferences and applies the caption style as CSS variables on the page. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [error, setError] = useState('');
  useEffect(() => { loadPreferences().then(setPrefs).catch(() => {}); }, []);
  useEffect(() => {
    const vars = captionVars(resolveCaption(prefs));
    for (const [name, value] of Object.entries(vars)) document.documentElement.style.setProperty(name, value);
    document.documentElement.dataset.captionColors = resolveCaption(prefs).colors;
  }, [prefs]);
  function update(change: Partial<Preferences>) {
    setPrefs(previous => {
      const next = { ...previous, ...change };
      savePreferences(next).then(() => setError(''), () => setError('Could not save this setting in this browser.'));
      return next;
    });
  }
  return <PreferencesContext.Provider value={{ prefs, update, error }}>{children}</PreferencesContext.Provider>;
}
export const usePreferences = () => useContext(PreferencesContext);
