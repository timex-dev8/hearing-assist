import { useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { prefersReducedMotion } from './reduced-motion';

export type RevealClass = '' | 'rv-pre' | 'rv-in';

/**
 * A section that starts below the fold fades in once, rising 12px, when it scrolls into view.
 * Does nothing under Reduce Motion, without IntersectionObserver, or when the section starts on screen,
 * so content is never hidden from someone who can't or won't trigger the reveal.
 */
export function useReveal<T extends HTMLElement>(): { ref: RefObject<T | null>; className: RevealClass } {
  const ref = useRef<T>(null);
  const [className, setClassName] = useState<RevealClass>('');
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || typeof IntersectionObserver === 'undefined') return;
    if (el.getBoundingClientRect().top <= window.innerHeight) return;
    setClassName('rv-pre');
    const io = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      setClassName('rv-in');
      io.disconnect();
    }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, className };
}
