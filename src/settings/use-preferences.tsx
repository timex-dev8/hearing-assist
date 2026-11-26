import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { store } from '../storage';
import { captionVars, defaults, resolveCaption, type Preferences } from './caption-style';

type Value = { prefs: Preferences; update: (change: Partial<Preferences>) => void; error: string };
const PreferencesContext = createContext<Value>({ prefs: defaults, update: () => {}, error: '' });

/** Loads reader preferences and applies appearance and caption style to the page. */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(defaults);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const touched = useRef(false); // a change made while loading wins over the saved copy
  useEffect(() => {
    store.loadPreferences().then(saved => { if (!touched.current) setPrefs(saved); }).catch(() => {}).finally(() => setLoaded(true));
  }, []);
  useEffect(() => {
    if (!loaded) return; // keep the first-paint theme from index.html until the saved one is known
    const root = document.documentElement;
    const caption = resolveCaption(prefs);
    for (const [name, value] of Object.entries(captionVars(caption))) root.style.setProperty(name, value);
    root.dataset.captionColors = caption.colors;
    root.dataset.theme = prefs.appearance;
    try { localStorage.setItem('ha-theme', prefs.appearance); } catch { /* storage off: the app still applies it after load */ }
  }, [prefs, loaded]);
  function update(change: Partial<Preferences>) {
    touched.current = true;
    setLoaded(true);
    setPrefs(previous => {
      const next = { ...previous, ...change };
      store.savePreferences(next).then(() => setError(''), () => setError('Couldn’t save this setting in this browser.'));
      return next;
    });
  }
  return <PreferencesContext.Provider value={{ prefs, update, error }}>{children}</PreferencesContext.Provider>;
}
export const usePreferences = () => useContext(PreferencesContext);
