import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { primaryTools } from '../data/tools';

const toolPaths = new Set(primaryTools.map(tool => tool.path));

export default function PageNavigation() {
  const { pathname, hash, key } = useLocation();

  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
    return () => { window.history.scrollRestoration = previous; };
  }, []);

  useLayoutEffect(() => {
    // Tools own their landing position; waiting for their workspace avoids a lazy-route race.
    if (!toolPaths.has(pathname) && !hash) window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, hash, key]);

  return null;
}
