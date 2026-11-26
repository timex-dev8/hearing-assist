import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { PreferencesProvider } from './settings/use-preferences';
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';

createRoot(document.getElementById('root')!).render(<StrictMode><PreferencesProvider><App /></PreferencesProvider></StrictMode>);
