import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Redirect, Route, Switch } from 'wouter';
import { PreferencesProvider } from './settings/use-preferences';
import { Landing } from './landing/landing';
import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';

const AppRoot = lazy(() => import('./app/app'));
const standalone = () => matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

function Root() {
  return <Switch>
    {/* Opened from a Home Screen icon (saved before the app moved to /app): go straight to the app. */}
    <Route path="/">{standalone() ? <Redirect to="/app" replace /> : <Landing />}</Route>
    <Route path="/new"><Redirect to="/app/new" replace /></Route>
    <Route path="/settings"><Redirect to="/app/settings" replace /></Route>
    <Route path="/session/:id">{({ id }) => <Redirect to={'/app/session/' + id} replace />}</Route>
    <Route><Suspense fallback={<p className="boot" role="status">Opening Hearing Assist…</p>}><AppRoot /></Suspense></Route>
  </Switch>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><PreferencesProvider><Root /></PreferencesProvider></StrictMode>);
