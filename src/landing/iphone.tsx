import type { ReactNode } from 'react';

/**
 * A current iPhone, drawn in CSS: titanium edge, side buttons, Dynamic Island, rounded screen.
 * Used only on the landing page. The drawing is decorative, so the figure carries a text alternative.
 */
export function IPhone({ children, label }: { children: ReactNode; label: string }) {
  return <figure className="l-iphone" aria-label={label}>
    <div className="l-phone" aria-hidden="true">
      <span className="l-btn-side a" /><span className="l-btn-side b" /><span className="l-btn-side c" /><span className="l-btn-side d" />
      <div className="l-phone-screen">{children}</div>
    </div>
  </figure>;
}
