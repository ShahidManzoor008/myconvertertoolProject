import { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// Runs when the tool actually mounts, including after a lazy route finishes loading.
export const useToolWorkspace = () => {
  const workspaceRef = useRef(null);
  const { key } = useLocation();

  useLayoutEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    workspace.scrollIntoView?.({ block: 'start', behavior: 'instant' });
    // Focus the region rather than its input so mobile keyboards stay closed.
    workspace.focus({ preventScroll: true });
  }, [key]);

  return workspaceRef;
};
