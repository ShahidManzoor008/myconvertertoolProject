import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_STEPS = [
  { message: "Preparing files...", progress: 12 },
  { message: "Uploading to converter...", progress: 34 },
  { message: "Processing document...", progress: 62 },
  { message: "Generating download...", progress: 86 },
];

export const useConversionProgress = (steps = DEFAULT_STEPS) => {
  const [state, setState] = useState({
    active: false,
    message: steps[0]?.message || "Preparing...",
    progress: 0,
    status: "idle",
  });
  const timersRef = useRef([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const start = useCallback(() => {
    clearTimers();
    setState({
      active: true,
      message: steps[0]?.message || "Preparing...",
      progress: Math.min(steps[0]?.progress || 10, 20),
      status: "running",
    });

    steps.slice(1).forEach((step, index) => {
      const timer = window.setTimeout(() => {
        setState((current) => {
          if (current.status !== "running") {
            return current;
          }

          return {
            active: true,
            message: step.message,
            progress: Math.max(current.progress, step.progress),
            status: "running",
          };
        });
      }, 650 + index * 850);

      timersRef.current.push(timer);
    });
  }, [clearTimers, steps]);

  const complete = useCallback((message = "Conversion complete") => {
    clearTimers();
    setState({
      active: true,
      message,
      progress: 100,
      status: "complete",
    });

    const timer = window.setTimeout(() => {
      setState((current) => ({
        ...current,
        active: false,
      }));
    }, 1200);

    timersRef.current.push(timer);
  }, [clearTimers]);

  const fail = useCallback((message = "Conversion failed") => {
    clearTimers();
    setState((current) => ({
      active: true,
      message,
      progress: Math.max(current.progress, 100),
      status: "error",
    }));
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setState({
      active: false,
      message: steps[0]?.message || "Preparing...",
      progress: 0,
      status: "idle",
    });
  }, [clearTimers, steps]);

  useEffect(() => clearTimers, [clearTimers]);

  return {
    ...state,
    start,
    complete,
    fail,
    reset,
  };
};
